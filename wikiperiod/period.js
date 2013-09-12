/*
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
	
	A copy of the license is at COPYING.txt (in this directory).
*/
wgUserLanguage=navigator.language;
function getSymbol(claims){
	return claims["P246"][0].mainsnak.datavalue.value;
}
function getClaims(entities,callback){
	$.get(
		"//www.wikidata.org/w/api.php",
		{
			action:"wbgetentities",
			format:"json",
			ids:entities,
			props:"labels|claims",
			languages:wgUserLanguage
		},
		function(data){
			var elements={};
			$.each(data.entities,function(k,v){
				elements[getSymbol(v.claims)]={label:v.labels[wgUserLanguage].value,id:k};
			});
			console.log(elements);
			callback(elements);
		},
		"jsonp"
	);
}
function putInTable(elements){
	$.each(elements,function(k,v){
		$("#period tr")
		.append(
			$("<td>")
			.append(
				$("<span>")
				.css("font-size","1.7em")
				.text(k)
			)
			.append("<br/>")
			.append(
				$("<a>")
				.text(v.label)
				.attr("href","//www.wikidata.org/wiki/"+v.id)
			)
		);
	});
}
function getElements(){
	$.get(
		"//www.wikidata.org/w/api.php",
		{
			action:"query",
			format:"json",
			generator:"backlinks",
			gblnamespace:0,
			gbllimit:"max",
			gbltitle:"Property:P246",
			gblfilterredir:"nonredirects",
			prop:""
		},
		function(data){
			var titles=$.map(data.query.pages,function(v){
				return v.title;
			});
			while(titles.length>0) getClaims(titles.splice(0,50).join("|"),function(elements){putInTable(elements);});
		},
		"jsonp"
	);
}
$(getElements);
