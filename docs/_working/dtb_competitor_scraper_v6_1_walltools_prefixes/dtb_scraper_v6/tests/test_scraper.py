import json
import tempfile
import unittest
from pathlib import Path

from bs4 import BeautifulSoup

import competitor_catalog_scraper as scraper


class ScraperTests(unittest.TestCase):
    def test_canonicalize_url_strips_query_fragment_and_trailing_slash(self):
        self.assertEqual(
            "https://example.com/Product",
            scraper.canonicalize_url("https://EXAMPLE.com/Product/?utm_source=x#top"),
        )

    def test_jsonld_product_extraction(self):
        html = """
        <html><head>
          <link rel="canonical" href="https://walltools.com/example-tool" />
          <script type="application/ld+json">
          {
            "@context":"https://schema.org",
            "@type":"Product",
            "name":"Example Tool",
            "brand":{"@type":"Brand","name":"TapeTech"},
            "sku":"05TT",
            "description":"Professional automatic taper.",
            "offers":{
              "@type":"Offer",
              "price":"689.00",
              "priceCurrency":"USD",
              "availability":"https://schema.org/InStock"
            }
          }
          </script>
        </head><body><h1>Ignored fallback</h1></body></html>
        """
        record = scraper.extract_product_record(scraper.SITES["wall_tools"], "https://walltools.com/example-tool?x=1", html)
        self.assertEqual("Example Tool", record.title)
        self.assertEqual("TapeTech", record.brand)
        self.assertEqual("05TT", record.sku)
        self.assertEqual("Professional automatic taper.", record.description)
        self.assertEqual("689.00", record.price)
        self.assertEqual("USD", record.currency)
        self.assertEqual("InStock", record.availability)
        self.assertEqual("jsonld", record.parse_method)
        self.assertEqual("https://walltools.com/example-tool", record.canonical_url)

    def test_product_candidate_rejects_non_product_paths(self):
        site = scraper.SITES["wall_tools"]
        self.assertFalse(scraper.is_product_candidate("https://walltools.com/blog/article", site))
        self.assertTrue(scraper.is_product_candidate("https://walltools.com/tapetech-easyclean-taper", site))

    def test_resume_reads_completed_canonical_urls(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            site_dir = out / "wall_tools"
            site_dir.mkdir()
            (site_dir / "products.jsonl").write_text(
                json.dumps({"canonical_url": "https://walltools.com/a", "title": "A", "sku": "COLM-A", "price": "10.00"}) + "\n" +
                json.dumps({"canonical_url": "https://walltools.com/b", "title": "B", "sku": "COLM-B", "price": ""}) + "\n",
                encoding="utf-8",
            )
            instance = scraper.Scraper(
                site=scraper.SITES["wall_tools"],
                output_dir=out,
                workers=1,
                per_host=1,
                timeout=1,
                retries=0,
                request_interval=0,
                respect_robots=True,
                max_urls=100,
                verbose=False,
            )
            self.assertIn("https://walltools.com/a", instance.completed_urls)
            self.assertNotIn("https://walltools.com/b", instance.completed_urls)

    def test_extract_jsonld_graph(self):
        soup = BeautifulSoup(
            '<script type="application/ld+json">{"@graph":[{"@type":"Product","name":"X"}]}</script>',
            "html.parser",
        )
        products = scraper.extract_jsonld_products(soup)
        self.assertEqual(1, len(products))
        self.assertEqual("X", products[0]["name"])

    def test_suitecommerce_item_price_extraction(self):
        item = {
            "storedisplayname2": "TapeTech Part",
            "itemid": "059091",
            "urlcomponent": "059091-6-32-X-1-2-Fill-Hd-Screw",
            "onlinecustomerprice_detail": {"onlinecustomerprice": 12.34, "formatted": "$12.34"},
            "pricelevel1": 15.00,
            "isinstock": True,
            "storedetaileddescription": "Replacement TapeTech part.",
        }
        record = scraper.record_from_suitecommerce_item(
            scraper.SITES["all_wall"], "https://www.all-wall.com/api/items", item
        )
        self.assertEqual("TapeTech Part", record.title)
        self.assertEqual("059091", record.sku)
        self.assertEqual("12.34", record.price)
        self.assertEqual("Replacement TapeTech part.", record.description)
        self.assertEqual("15.0", record.regular_price)
        self.assertEqual("InStock", record.availability)
        self.assertEqual("suitecommerce_item_search_api", record.parse_method)

    def test_bigcommerce_dom_price_fallback(self):
        html = '<html><head><meta property="og:title" content="Tool"></head><body><span class="price--withTax">$123.45</span></body></html>'
        record = scraper.extract_product_record(scraper.SITES["wall_tools"], "https://walltools.com/tool", html)
        self.assertEqual("123.45", record.price)

    def test_csv_exports_exact_five_columns(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            site_dir = out / "wall_tools"
            site_dir.mkdir()
            (site_dir / "products.jsonl").write_text(
                json.dumps({
                    "canonical_url": "https://walltools.com/tool",
                    "title": "Tool",
                    "brand": "TapeTech",
                    "sku": "05TT",
                    "price": "123.45",
                    "description": "<p>Great tool.</p>",
                    "retrieved_at": "2026-09-09T00:00:00Z"
                }) + "\n", encoding="utf-8"
            )
            csv_path = scraper.export_csv(out, ["wall_tools"])
            text = csv_path.read_text(encoding="utf-8-sig")
            self.assertEqual(
                "Brand,Product Name,SKU,Product Price,Product Description",
                text.splitlines()[0],
            )
            self.assertIn("TapeTech,Tool,05TT,123.45,Great tool.", text)

    def test_all_wall_visible_mpn_is_export_identifier(self):
        html = """
        <html><body>
          <main>
            <div class="product-info">Mfr : TapeTech MPN : 07TT-C</div>
            <h1>TapeTech Carbon Fiber Automatic Taper 07TT-C</h1>
            <div>SKU: 14767</div>
            <span class="price--withTax">$1,780.00</span>
          </main>
        </body></html>
        """
        record = scraper.extract_product_record(
            scraper.SITES["all_wall"],
            "https://www.all-wall.com/TapeTech-Carbon-Fiber-Taper-14767",
            html,
        )
        self.assertEqual("07TT-C", record.mpn)
        self.assertEqual("TapeTech", record.brand)
        self.assertEqual("1780.00", record.price)
        self.assertEqual("07TT-C", scraper.output_identifier("all_wall", record.__dict__))

    def test_suitecommerce_prefers_mpn_over_store_sku_for_all_wall_export(self):
        item = {
            "storedisplayname2": "TapeTech Carbon Fiber Automatic Taper 07TT-C",
            "itemid": "14767",
            "mpn": "07TT-C",
            "urlcomponent": "TapeTech-Carbon-Fiber-Taper-14767",
            "onlinecustomerprice_detail": {"onlinecustomerprice": 1780.00},
            "manufacturer": "TapeTech",
        }
        record = scraper.record_from_suitecommerce_item(
            scraper.SITES["all_wall"], "https://www.all-wall.com/api/items", item
        )
        self.assertEqual("14767", record.sku)
        self.assertEqual("07TT-C", record.mpn)
        self.assertEqual("07TT-C", scraper.output_identifier("all_wall", record.__dict__))

    def test_all_wall_csv_uses_mpn_not_store_sku(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            site_dir = out / "all_wall"
            site_dir.mkdir()
            (site_dir / "products.jsonl").write_text(
                json.dumps({
                    "competitor": "all_wall",
                    "canonical_url": "https://www.all-wall.com/TapeTech-Carbon-Fiber-Taper-14767",
                    "title": "TapeTech Carbon Fiber Automatic Taper 07TT-C",
                    "brand": "TapeTech",
                    "sku": "14767",
                    "mpn": "07TT-C",
                    "price": "1780.00",
                    "description": "Carbon fiber automatic taper.",
                    "retrieved_at": "2026-09-09T00:00:00Z"
                }) + "\n", encoding="utf-8"
            )
            csv_path = scraper.export_csv(out, ["all_wall"])
            text = csv_path.read_text(encoding="utf-8-sig")
            self.assertIn("TapeTech,TapeTech Carbon Fiber Automatic Taper 07TT-C,07TT-C,1780.00", text)
            self.assertNotIn(",14767,", text)

    def test_als_sku_is_preserved_exactly(self):
        row = {"sku": "059091", "mpn": "OTHER"}
        self.assertEqual("059091", scraper.output_identifier("als_taping_tools", row))

    def test_wall_tools_verified_prefixes_are_removed(self):
        cases = {
            "LEV5-12345": "12345",
            "DURA-ABC123": "ABC123",
            "SURP-X100": "X100",
            "TAPE-07TT": "07TT",
            "COLM-TAPER": "TAPER",
            "colm-fa245": "fa245",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(expected, scraper.output_identifier("wall_tools", {"sku": raw}))

    def test_wall_tools_unknown_prefix_is_preserved(self):
        self.assertEqual("DMT-30DMCFW", scraper.output_identifier("wall_tools", {"sku": "DMT-30DMCFW"}))
        self.assertEqual("OTHER-07TT", scraper.output_identifier("wall_tools", {"sku": "OTHER-07TT"}))

    def test_request_url_normalization_preserves_query(self):
        self.assertEqual(
            "https://example.com/sitemap.php?type=products&page=2",
            scraper.normalize_request_url("https://EXAMPLE.com/sitemap.php?type=products&page=2#x"),
        )

    def test_visible_wall_tools_sku_is_extracted_then_normalized(self):
        html = """
        <html><body><h1>Columbia Automatic Taper</h1>
        <div>SKU: COLM-TAPER</div><span class='price--withTax'>$1,649.29</span>
        <div class='productView-description'>Precision automatic taper.</div></body></html>
        """
        record = scraper.extract_product_record(scraper.SITES["wall_tools"], "https://walltools.com/columbia-taper", html)
        self.assertEqual("COLM-TAPER", record.sku)
        self.assertEqual("TAPER", scraper.output_identifier("wall_tools", record.__dict__))
        self.assertEqual("1649.29", record.price)

    def test_site_catalog_csv_preserves_five_column_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            site_dir = out / "wall_tools"
            site_dir.mkdir()
            (site_dir / "products.jsonl").write_text(json.dumps({
                "competitor": "wall_tools", "canonical_url": "https://walltools.com/taper",
                "title": "Columbia Automatic Taper", "brand": "Columbia Taping Tools",
                "sku": "COLM-TAPER", "price": "1649.29", "description": "Precision tool.",
                "retrieved_at": "2026-09-09T00:00:00Z"
            }) + "\n", encoding="utf-8")
            scraper.export_csv(out, ["wall_tools"])
            site_csv = (site_dir / "catalog.csv").read_text(encoding="utf-8-sig")
            self.assertEqual("Brand,Product Name,SKU,Product Price,Product Description", site_csv.splitlines()[0])
            self.assertIn(",TAPER,1649.29,", site_csv)


if __name__ == "__main__":
    unittest.main()
