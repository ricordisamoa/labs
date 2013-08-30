<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GeoContribs</title>
<link href="//upload.wikimedia.org/wikipedia/commons/f/fe/Crystal_Clear_app_browser.png" rel="shortcut icon" type="image/png">
<link rel="stylesheet" href="leaflet/leaflet.css">
<!--[if lte IE 8]>
     <link rel="stylesheet" href="leaflet/leaflet.ie.css" />
<![endif]-->
<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script type="text/javascript" src="leaflet/leaflet.js"></script>
</head>
<body>
<header>
<?php
if(isset($_GET['p'])==false and isset($_GET['u'])==false){
	echo '<h1>GeoContribs</h1>'.chr(10).'</header>'.chr(10).'<form method="get">'.chr(10),
	'<label>DBname: <input type="text" name="p" required placeholder="enwiki"></label><br>'.chr(10),
	'<label>User name: <input type="text" name="u" required placeholder="Jimbo Wales"></label><br>'.chr(10),
	'<label>Max. results: <input type="range" min="50" max="10000" value="500" step="10" name="limit"></label><br>'.chr(10),
	'<input type="submit">'.chr(10).'</form>';
}
else{

if($_GET['p']) $proj=$_GET['p'];
if($_GET['u']) $user=$_GET['u'];
if($_GET['limit']) $limit=intval($_GET['limit']);
else $limit=500;

$baseurl=null;
$sitematrix=file_get_contents('http://meta.wikimedia.org/w/api.php?action=sitematrix&format=json&smlangprop=site&smsiteprop=dbname|url');
$sitematrix=json_decode($sitematrix,true);
$sitematrix=$sitematrix['sitematrix'];
foreach($sitematrix as $index=>$language){
	if(is_array($language)){
		foreach(array_key_exists('site',$language)?$language['site']:$language as $sindex=>$val){
			if(is_array($val) and array_key_exists('dbname',$val) and array_key_exists('url',$val) and $val['dbname']==$proj){
				$baseurl=$val['url'];
				break 2;
			}
		}
	}
}
if($baseurl==null) die('No valid wiki provided.');

echo '<h1><a href=".">GeoContribs</a></h1>'.chr(10),
'<h2>Parsing <strong>'.$user.'</strong>\'s latest '.$limit.' contributions on '.$proj.'...</h2></header>';

$baseurl_rel=str_replace('http://','//',$baseurl);
$api=$baseurl.'/w/api.php?';

$continue=null;
$count=0;
$occurr=array();

$namespaces=array(0);
if($proj=='commonswiki') array_push($namespaces,6);

foreach($namespaces as $namespace){
	do{
		$query=array(
			action=>'query',
			'list'=>'usercontribs',
			ucuser=>$user,
			ucprop=>'title|timestamp|ids',
			ucnamespace=>$namespace,
			uclimit=>($limit-$count>500?'max':$limit-$count),
			format=>'json'
		);
		if($continue!=null) $query=array_merge($query,$continue);
		$query=json_decode(file_get_contents($api.http_build_query($query)),true);
		$continue=$query['query-continue']['usercontribs'];
		$query=$query['query']['usercontribs'];
		$count+=count($query);
		foreach($query as $key=>$val){
			if(array_key_exists($val['title'],$occurr)){
				if(is_array($occurr[$val['title']])) $occurr[$val['title']]=2;
				else $occurr[$val['title']]+=1;
			}
			else $occurr[$val['title']]=$val;
		}
	}
	while($continue!=null and $continue!='' and $count<$limit);
}

$titles=array_keys($occurr);
$coords=array();

do{
	$query=http_build_query(array(
		action=>'query',
		prop=>'coordinates',
		format=>'json',
		titles=>implode(array_splice($titles,0,50),'|')
	));
	$dec=json_decode(file_get_contents($api.$query),true);
	$coords=array_merge($coords,$dec['query']['pages']);
}
while(count($titles)>0);

echo '<script type="text/javascript">'.chr(10).'$(function(){'.chr(10).'$("#map").css("height","400px");'.chr(10),
'var map = L.map(\'map\').setView([0,0],2);'.chr(10),
'new L.TileLayer(\'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\', {minZoom: 2, maxZoom: 18, attribution: \'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors\'}).addTo(map);'.chr(10);

$colors=array('bisque','black','blue','coral','cyan','darkslategray','deeppink','green','lightgrey','lime','magenta','orange','purple','red','teal','yellow');

$markers=array();

foreach($coords as $pageid=>$page){
	if(isset($page['coordinates'])){
		$coordinates=$page['coordinates'];
		if(count($coordinates)==1){
			$coordinates=$coordinates[0];
			$title=addcslashes($page['title'],'\\\'\"&<>');
			$title='<strong><a href="'.$baseurl_rel.'/wiki/'.str_replace(' ','_',htmlspecialchars($title)).'">'.$title.'</a></strong>';
			$edits=$occurr[$page['title']];
			$numedits=(is_array($edits)?1:$edits);
			$color=$colors[rand(0,count($colors)-1)];
			$icon='L.icon({iconUrl:\'//commons.wikimedia.org/wiki/Special:Filepath/Location_dot_'.$color.'.svg\',iconSize:['.($numedits*10).','.($numedits*10).']})';
			if(is_array($edits) and array_key_exists('revid',$edits)){
				$edits='<a href="'.$baseurl_rel.'/w/index.php?diff='.$edits['revid'].'">1 edit</a>';
			}
			else $edits=$edits.' edits';
			if(!array_key_exists($numedits,$markers)) $markers[$numedits]=array();
			array_push($markers[$numedits],'L.marker(['.$coordinates['lat'].','.$coordinates['lon'].'],{icon:'.$icon.'}).addTo(map).bindPopup(\''.$title.'<br>'.$edits.'\');');
		}
	}
	//else echo chr(10).'// "'.$page['title'].'" has no coordinates';
}
krsort($markers,SORT_NUMERIC);
foreach($markers as $numedits=>$codes){
	echo implode(chr(10),$codes).chr(10);
}
echo chr(10).'});'.chr(10).'</script><div id="map"></div>';

}

?>

<a href="https://github.com/ricordisamoa/labs/tree/master/geocontribs"><img style="position: fixed; top: 0; right: 0; border: 0;" src="//s3.amazonaws.com/github/ribbons/forkme_right_orange_ff7600.png" alt="Fork me on GitHub"></a>
</body>
</html>
