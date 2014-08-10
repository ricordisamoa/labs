<!--
	This file is part of WikiPeriod © 2012-2013 by Ricordisamoa.

	WikiPeriod is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	WikiPeriod is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with WikiPeriod.  If not, see <http://www.gnu.org/licenses/>.
	
	A copy of the license is at LICENSE (in the parent directory).
-->
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>WikiPeriod by Ricordisamoa</title>
<link rel="shortcut icon" href="//upload.wikimedia.org/wikipedia/commons/thumb/a/af/Dmitri_Mendeleev.jpg/27px-Dmitri_Mendeleev.jpg">
<link rel="canonical" href="https://tools.wmflabs.org/ricordisamoa/period/">
<link rel="help" href="docs.html">
<link rel="stylesheet" href="common.css">
</head>
<body>
<h1>WikiPeriod by Ricordisamoa
<sub><a href="docs.html">docs</a>, <a href="license.html">license</a></sub></h1>
<table id="period">
<tr>
<?php
$api = 'http://www.wikidata.org/w/api.php?';
$languages = array('en');
$userlang = 'en';
if ($_GET['lang'] and $_GET['lang'] != 'en') {
	$userlang = $_GET['lang'];
	array_push($languages, $_GET['lang']);
}
$items = file_get_contents(
	$api . http_build_query(
		array(
			'action' => 'query',
			'format' => 'json',
			'generator' => 'backlinks',
			'gblnamespace' => 0,
			'gbllimit' => 'max',
			'gbltitle' => 'Property:P246',
			'gblfilterredir' => 'nonredirects',
			'prop' => ''
		)
	)
);
$titles = array();
$data = json_decode($items, true);
foreach ($data['query']['pages'] as $id => $item) {
	array_push($titles, $item['title']);
}
$elements = array();
while (count($titles) > 0) {
	$data = file_get_contents(
		$api . http_build_query(
			array(
				'action' => 'wbgetentities',
				'format' => 'json',
				'ids' => implode(array_splice($titles, 0, 50), '|'),
				'props' => 'labels|claims|descriptions',
				'languages' => implode($languages, '|')
			)
		)
	);
	$data = json_decode($data, true);
	$elements = array_merge($elements, $data['entities']);
}
$final = array();
foreach ($elements as $id => $element) {
	$link = '//www.wikidata.org/wiki/' . $id;
	$anchor = '<a href="' . $link . '">' . $id . '</a>';
	if (!array_key_exists('claims', $element)) {
		die('Claims not found on ' . $anchor . '!');
	}
	if (!array_key_exists('P246', $element['claims'])) {
		die('Chemical symbol not found on ' . $anchor . '!');
	}
	if (!array_key_exists('descriptions', $element)) {
		die('Descriptions not found on ' . $anchor . '!');
	}
	if (!array_key_exists('en', $element['descriptions'])) {
		die('English description not found on ' . $anchor . '!');
	}
	$desc = $element['descriptions']['en']['value'];
	preg_match('/(chemical )?element with (an |the |)atomic number (of |)(\d+)\b/', $desc, $matches);
	$num = intval($matches[4]);
	$symbol = $element['claims']['P246'][0]['mainsnak']['datavalue']['value'];
	$label = $element['labels'][$userlang]['value'];
	$final[$num] = array(
		'symbol' => $symbol,
		'label' => $label,
		'id' => $id
	);
}
ksort($final, SORT_NUMERIC);
foreach ($final as $num => $element) {
	$link = '//www.wikidata.org/wiki/' . $element['id'];
	echo '<td><span>' . $element['symbol'] . '</span><br/><a href="' . $link . '">' . $element['label'] . '</a><br/>' . $num . '</td>';
	if ($num % 12 === 0) {
		echo '</tr><tr>';
	}
}
?>
</tr>
</table>
<a href="//github.com/ricordisamoa/labs/tree/master/period"><img style="position: fixed; top: 0; right: 0; border: 0;" src="//s3.amazonaws.com/github/ribbons/forkme_right_gray_6d6d6d.png" alt="Fork me on GitHub"></a>
</body>
</html>
