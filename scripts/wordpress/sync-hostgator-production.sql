/*
 * Drywall Toolbox HostGator production identity synchronization.
 * Run only during the approved root-domain launch.
 * Database: benconkl_drywalltoolbox
 * Installation: kf5_
 */

START TRANSACTION;

SELECT option_name, option_value
FROM benconkl_drywalltoolbox.kf5_options
WHERE option_name IN ( 'home', 'siteurl' )
ORDER BY option_name;

UPDATE benconkl_drywalltoolbox.kf5_options
SET option_value = CASE option_name
	WHEN 'home' THEN 'https://drywalltoolbox.com'
	WHEN 'siteurl' THEN 'https://drywalltoolbox.com/wp'
	ELSE option_value
END
WHERE option_name IN ( 'home', 'siteurl' );

SELECT option_name, option_value
FROM benconkl_drywalltoolbox.kf5_options
WHERE option_name IN ( 'home', 'siteurl' )
ORDER BY option_name;

COMMIT;
