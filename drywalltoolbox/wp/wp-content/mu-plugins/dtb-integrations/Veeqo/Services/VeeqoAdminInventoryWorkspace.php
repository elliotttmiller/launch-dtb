<?php
/**
 * Sortable inventory workspace and bounded WooCommerce-owned bulk edits.
 *
 * Veeqo inventory quantities and immutable identifiers remain read-only here.
 *
 * @package drywall-toolbox
 */

defined( 'ABSPATH' ) || exit;

final class DTB_Veeqo_Admin_Inventory_Workspace {
	private const MAX_BULK = 100;
	private const TTL      = 15 * MINUTE_IN_SECONDS;

	public static function inventory( array $args ): array {
		global $wpdb;
		$page = max( 1, absint( $args['page'] ?? 1 ) );
		$per_page = min( 100, max( 10, absint( $args['per_page'] ?? 50 ) ) );
		$offset = ( $page - 1 ) * $per_page;
		$search = trim( sanitize_text_field( (string) ( $args['search'] ?? '' ) ) );
		$stock = sanitize_key( (string) ( $args['stock_status'] ?? '' ) );
		$mapping = sanitize_key( (string) ( $args['mapping'] ?? '' ) );
		$type = sanitize_key( (string) ( $args['type'] ?? '' ) );
		$order = 'desc' === strtolower( (string) ( $args['order'] ?? 'asc' ) ) ? 'DESC' : 'ASC';
		$orderby = sanitize_key( (string) ( $args['orderby'] ?? 'sku' ) );
		$order_map = [
			'name' => 'product_name', 'sku' => 'lookup.sku', 'stock_quantity' => 'lookup.stock_quantity',
			'stock_status' => 'lookup.stock_status', 'updated' => 'p.post_modified_gmt',
			'on_hand' => 'lookup.stock_quantity', 'available' => 'lookup.stock_quantity',
			'committed' => 'committed_value', 'incoming' => 'incoming_value', 'mapping' => 'mapping_status',
		];
		$order_column = $order_map[ $orderby ] ?? $order_map['sku'];
		$where = [ "p.post_type IN ('product','product_variation')", "p.post_status NOT IN ('trash','auto-draft')", "lookup.sku <> ''" ];
		$params = [];
		if ( '' !== $search ) {
			$like = '%' . $wpdb->esc_like( $search ) . '%';
			$where[] = "(COALESCE(NULLIF(p.post_title,''),parent.post_title) LIKE %s OR lookup.sku LIKE %s)";
			$params[] = $like; $params[] = $like;
		}
		if ( in_array( $stock, [ 'instock', 'outofstock', 'onbackorder' ], true ) ) { $where[] = 'lookup.stock_status = %s'; $params[] = $stock; }
		elseif ( 'lowstock' === $stock ) { $where[] = 'lookup.stock_quantity > 0 AND lookup.stock_quantity <= 3'; }
		elseif ( 'negative' === $stock ) { $where[] = 'CAST(COALESCE(raw_available.meta_value, lookup.stock_quantity, 0) AS SIGNED) < 0'; }
		elseif ( 'committed_exceeds_on_hand' === $stock ) { $where[] = 'CAST(COALESCE(committed.meta_value,0) AS SIGNED) > CAST(COALESCE(on_hand.meta_value,lookup.stock_quantity,0) AS SIGNED)'; }
		if ( 'mapped' === $mapping ) $where[] = "sellable.meta_value IS NOT NULL AND sellable.meta_value <> '' AND (mapped.meta_value IS NULL OR mapped.meta_value = lookup.sku)";
		elseif ( 'unmapped' === $mapping ) $where[] = "(sellable.meta_value IS NULL OR sellable.meta_value = '')";
		elseif ( 'mismatch' === $mapping ) $where[] = "sellable.meta_value IS NOT NULL AND sellable.meta_value <> '' AND mapped.meta_value IS NOT NULL AND mapped.meta_value <> lookup.sku";
		if ( 'simple' === $type ) $where[] = "p.post_type = 'product'";
		elseif ( 'variation' === $type ) $where[] = "p.post_type = 'product_variation'";
		$meta = static fn( string $key ): string => "(SELECT post_id, MAX(meta_value) meta_value FROM {$wpdb->postmeta} WHERE meta_key='{$key}' GROUP BY post_id)";
		$from = "FROM {$wpdb->posts} p LEFT JOIN {$wpdb->posts} parent ON parent.ID=p.post_parent INNER JOIN {$wpdb->prefix}wc_product_meta_lookup lookup ON lookup.product_id=p.ID
		LEFT JOIN {$meta('_veeqo_sellable_id')} sellable ON sellable.post_id=p.ID LEFT JOIN {$meta('_veeqo_mapped_sku')} mapped ON mapped.post_id=p.ID
		LEFT JOIN {$meta('_thumbnail_id')} thumb ON thumb.post_id=p.ID LEFT JOIN {$meta('_veeqo_stock_raw_available')} raw_available ON raw_available.post_id=p.ID
		LEFT JOIN {$meta('_veeqo_stock_on_hand')} on_hand ON on_hand.post_id=p.ID LEFT JOIN {$meta('_veeqo_stock_committed')} committed ON committed.post_id=p.ID
		LEFT JOIN {$meta('_veeqo_stock_incoming')} incoming ON incoming.post_id=p.ID";
		$where_sql = implode( ' AND ', $where );
		$count_sql = "SELECT COUNT(*) {$from} WHERE {$where_sql}";
		$total = (int) $wpdb->get_var( empty( $params ) ? $count_sql : $wpdb->prepare( $count_sql, ...$params ) );
		$select = "SELECT p.ID,p.post_parent,COALESCE(NULLIF(p.post_title,''),parent.post_title) product_name,p.post_type,p.post_status,p.post_modified_gmt,lookup.sku,lookup.stock_quantity,lookup.stock_status,
		CAST(COALESCE(on_hand.meta_value,lookup.stock_quantity,0) AS SIGNED) on_hand_value,CAST(COALESCE(committed.meta_value,0) AS SIGNED) committed_value,
		CAST(COALESCE(raw_available.meta_value,lookup.stock_quantity,0) AS SIGNED) available_value,CAST(COALESCE(incoming.meta_value,0) AS SIGNED) incoming_value,
		sellable.meta_value veeqo_sellable_id,mapped.meta_value veeqo_mapped_sku,thumb.meta_value thumbnail_id,
		CASE WHEN sellable.meta_value IS NULL OR sellable.meta_value='' THEN 'unmapped' WHEN mapped.meta_value IS NOT NULL AND mapped.meta_value<>lookup.sku THEN 'mismatch' ELSE 'mapped' END mapping_status
		{$from} WHERE {$where_sql} ORDER BY {$order_column} {$order},p.ID ASC LIMIT %d OFFSET %d";
		$rows = $wpdb->get_results( $wpdb->prepare( $select, ...array_merge( $params, [ $per_page, $offset ] ) ), ARRAY_A );
		$warehouse = absint( ( function_exists( 'dtb_veeqo_config' ) ? dtb_veeqo_config()['warehouse_id'] ?? 0 : 0 ) );
		$items = [];
		foreach ( (array) $rows as $row ) {
			$id = absint( $row['ID'] ); $on = (int) $row['on_hand_value']; $com = (int) $row['committed_value']; $avail = (int) $row['available_value'];
			$items[] = [
				'product_id'=>$id,'parent_id'=>absint($row['post_parent']),'name'=>sanitize_text_field($row['product_name']),'type'=>'product_variation'===$row['post_type']?'variation':'simple',
				'publish_status'=>sanitize_key($row['post_status']),'sku'=>sanitize_text_field($row['sku']),'location'=>'Warehouse #'.$warehouse,
				'on_hand'=>$on,'committed'=>$com,'available'=>$avail,'incoming'=>(int)$row['incoming_value'],'stock_status'=>sanitize_key($row['stock_status']),
				'veeqo_sellable_id'=>absint($row['veeqo_sellable_id'])?:null,'veeqo_mapped_sku'=>sanitize_text_field((string)$row['veeqo_mapped_sku']),'mapping_status'=>sanitize_key($row['mapping_status']),
				'image_url'=>absint($row['thumbnail_id'])?(string)wp_get_attachment_image_url(absint($row['thumbnail_id']),'thumbnail'):'','updated_at'=>sanitize_text_field($row['post_modified_gmt']),
				'edit_url'=>get_edit_post_link($id,'raw'),'anomalies'=>array_values(array_filter([$avail<0?'negative_available':'',$com>$on?'committed_exceeds_on_hand':'','mismatch'===$row['mapping_status']?'mapping_mismatch':''])),
			];
		}
		return [ 'page'=>$page,'per_page'=>$per_page,'total'=>$total,'pages'=>max(1,(int)ceil($total/$per_page)),'items'=>$items,'source'=>'woocommerce_projection','sort'=>['orderby'=>$orderby,'order'=>strtolower($order)] ];
	}

	public static function item( int $id ) {
		$product = wc_get_product( $id );
		if ( ! $product instanceof WC_Product || ! in_array( $product->get_type(), [ 'simple','variation' ], true ) ) return new WP_Error('product_not_found','Product not found.',['status'=>404]);
		$list = self::inventory(['search'=>$product->get_sku(),'per_page'=>10]);
		$row = current(array_filter($list['items'],static fn($item)=>$item['product_id']===$id));
		if ( ! $row ) return new WP_Error('product_not_found','Product not found.',['status'=>404]);
		$parent = $product->get_parent_id() ? wc_get_product($product->get_parent_id()) : null;
		return $row + [ 'catalog_visibility'=>$product->get_catalog_visibility(),'backorders'=>$product->get_backorders(),'low_stock_amount'=>$product->get_low_stock_amount(),
			'parent'=>$parent instanceof WC_Product?['id'=>$parent->get_id(),'name'=>$parent->get_name(),'url'=>get_edit_post_link($parent->get_id(),'raw')]:null,
			'history'=>[['label'=>'WooCommerce updated','at'=>$product->get_date_modified()?$product->get_date_modified()->date(DATE_ATOM):''],['label'=>'Veeqo projected','at'=>(string)$product->get_meta('_veeqo_stock_synced_at',true)]] ];
	}

	public static function preview( array $payload ) { return self::bulk( $payload, false ); }
	public static function apply( array $payload ) { return self::bulk( $payload, true ); }

	private static function bulk( array $payload, bool $apply ) {
		$ids=array_values(array_unique(array_filter(array_map('absint',(array)($payload['product_ids']??[]))))); sort($ids,SORT_NUMERIC);
		if(!$ids||count($ids)>self::MAX_BULK)return new WP_Error('invalid_selection','Select between 1 and 100 products.',['status'=>400]);
		$changes=self::changes((array)($payload['changes']??[])); if(is_wp_error($changes))return $changes;
		if($apply){$hash=sanitize_text_field((string)($payload['preview_hash']??''));$manifest=get_transient('dtb_veeqo_bulk_'.$hash);if(!is_array($manifest)||$manifest['operator_id']!==get_current_user_id()||$manifest['ids']!==$ids||$manifest['changes']!==$changes)return new WP_Error('preview_mismatch','Preview expired or changed.',['status'=>409]);}
		$items=[];$failed=[];
		foreach($ids as $id){$p=wc_get_product($id);if(!$p instanceof WC_Product){$failed[]=['product_id'=>$id,'message'=>'Unavailable'];continue;}$before=self::snapshot($p);$after=array_replace($before,$changes);if($apply){try{self::write($p,$changes);$p->save();wc_delete_product_transients($id);}catch(Throwable $e){$failed[]=['product_id'=>$id,'message'=>sanitize_text_field($e->getMessage())];continue;}}$items[]=['product_id'=>$id,'sku'=>$p->get_sku(),'name'=>$p->get_name(),'before'=>$before,'after'=>$after];}
		if(!$apply){$manifest=['operator_id'=>get_current_user_id(),'ids'=>$ids,'changes'=>$changes];$hash=hash_hmac('sha256',wp_json_encode($manifest),wp_salt('auth'));set_transient('dtb_veeqo_bulk_'.$hash,$manifest,self::TTL);return ['preview_hash'=>$hash,'items'=>$items,'failed'=>$failed,'changes'=>$changes];}
		delete_transient('dtb_veeqo_bulk_'.$hash);if(function_exists('dtb_veeqo_log'))dtb_veeqo_log('info','admin_bulk_product_update','Bounded WooCommerce product fields updated from Veeqo control center.',['operator_id'=>get_current_user_id(),'updated'=>count($items),'failed'=>count($failed),'fields'=>array_keys($changes)]);
		return ['success'=>!$failed,'updated'=>$items,'failed'=>$failed,'message'=>sprintf('%d updated; %d failed.',count($items),count($failed))];
	}

	private static function changes(array $raw){$out=[];foreach(['status'=>['publish','draft','private','pending'],'catalog_visibility'=>['visible','catalog','search','hidden'],'backorders'=>['no','notify','yes']] as $key=>$allowed){if(isset($raw[$key])){$v=sanitize_key($raw[$key]);if(!in_array($v,$allowed,true))return new WP_Error('invalid_'.$key,'Invalid '.$key.'.',['status'=>400]);$out[$key]=$v;}}if(isset($raw['low_stock_amount'])&&''!==(string)$raw['low_stock_amount']){$v=filter_var($raw['low_stock_amount'],FILTER_VALIDATE_INT);if(false===$v||$v<0||$v>100000)return new WP_Error('invalid_low_stock','Invalid low-stock threshold.',['status'=>400]);$out['low_stock_amount']=(int)$v;}if(!$out)return new WP_Error('changes_required','No supported changes. Inventory quantities and identifiers are read-only.',['status'=>400]);ksort($out);return $out;}
	private static function snapshot(WC_Product $p):array{return ['status'=>$p->get_status(),'catalog_visibility'=>$p->get_catalog_visibility(),'backorders'=>$p->get_backorders(),'low_stock_amount'=>$p->get_low_stock_amount()];}
	private static function write(WC_Product $p,array $c):void{if(isset($c['status']))$p->set_status($c['status']);if(isset($c['catalog_visibility']))$p->set_catalog_visibility($c['catalog_visibility']);if(isset($c['backorders']))$p->set_backorders($c['backorders']);if(array_key_exists('low_stock_amount',$c))$p->set_low_stock_amount($c['low_stock_amount']);}
}
