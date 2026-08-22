/*
 * Drywall Toolbox HostGator staging identity synchronization.
 * Database: benconkl_drywalltoolbox
 * Installation: staging_kf5_
 *
 * This intentionally updates only the two scalar WordPress identity options.
 * It does not perform unsafe replacement inside serialized option/meta values.
 */

START TRANSACTION;

SELECT option_name, option_value
FROM benconkl_drywalltoolbox.staging_kf5_options
WHERE option_name IN ( 'home', 'siteurl' )
ORDER BY option_name;

UPDATE benconkl_drywalltoolbox.staging_kf5_options
SET option_value = CASE option_name
	WHEN 'home' THEN 'https://drywalltoolbox.com/staging/2972'
	WHEN 'siteurl' THEN 'https://drywalltoolbox.com/staging/2972/wp'
	ELSE option_value
END
WHERE option_name IN ( 'home', 'siteurl' );

SELECT option_name, option_value
FROM benconkl_drywalltoolbox.staging_kf5_options
WHERE option_name IN ( 'home', 'siteurl' )
ORDER BY option_name;

COMMIT;
