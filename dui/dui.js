/*

Deep User Inspector (DUI)
Copyright (C) 2013 Ricordisamoa

meta.wikimedia.org/wiki/User:Ricordisamoa
tools.wmflabs.org/ricordisamoa/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

/*
   Set of HEX colors
   by MediaWiki namespace number
   from Soxred93's Edit Counter - Copyright (C) 2010 Soxred93 - under the terms of the GNU General Public License
   tools.wmflabs.org/xtools/pcount/source.php?path=index
*/
colors={
	0:'FF5555',
	1:'55FF55',
	2:'FFFF55',
	3:'FF55FF',
	4:'5555FF',
	5:'55FFFF',
	6:'C00000',
	7:'0000C0',
	8:'008800',
	9:'00C0C0',
	10:'FFAFAF',
	11:'808080',
	12:'00C000',
	13:'404040',
	14:'C0C000',
	15:'C000C0',
	100:'75A3D1',
	101:'A679D2',
	102:'660000',
	103:'000066',
	104:'FAFFAF',
	105:'408345',
	106:'5c8d20',
	107:'e1711d',
	108:'94ef2b',
	109:'756a4a',
	110:'6f1dab',
	111:'301e30',
	112:'5c9d96',
	113:'a8cd8c',
	114:'f2b3f1',
	115:'9b5828',
	120:'FF99FF',
	121:'CCFFFF',
	122:'CCFF00',
	123:'CCFFCC',
	200:'33FF00',
	201:'669900',
	202:'666666',
	203:'999999',
	204:'FFFFCC',
	205:'FF00CC',
	206:'FFFF00',
	207:'FFCC00',
	208:'FF0000',
	209:'FF6600',
	446:'06DCFB',
	447:'892EE4',
	460:'99FF66',
	461:'99CC66',
	470:'CCCC33',
	471:'CCFF33',
	480:'6699FF',
	481:'66FFFF',
	710:'FFCECE',
	711:'FFC8F2',
	828:'F7DE00',
	829:'BABA21',
	866:'FFFFFF',
	867:'FFCCFF',
	1198:'FF34B3',
	1199:'8B1C62'
};
/* end of Soxred93's code */

/*
   Set of HTML colors
   by MediaWiki user group
   (arbitrary)
*/
rightsColors={
	'autopatrolled':'dodgerblue',
	'rollbacker':'darkolivegreen',
	'filemover':'orange',
	'translationadmin':'orangered',
	'sysop':'darkred',
	'bureaucrat':'darkviolet',
	'checkuser':'darkslategray',
	'oversight':'navy',
	'steward':'black'
};
function rightColor(right){
	return (typeof rightsColors[right]=='undefined')?right:('<span style="background-color:'+rightsColors[right]+';color:white">'+right+'</span>');
}
contribs=[];
uploads=[];

/* canonical day and month names to load MediaWiki translated messages */
weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
weekdaysShort=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getNamespaces(callback){
	$.get(
		api,
		{
			action:'query',
			meta:'siteinfo',
			siprop:'namespaces',
			format:'json'
		},
		function(b){
			var ns=b.query.namespaces;
			delete ns['-1'];
			callback(ns);
		},
		'jsonp'
	);
}
function getUploads(callback,aistart){
	$.get(
		api,
		$.extend(
			{
				action:'query',
				format:'json',
				list:'allimages',
				aiprop:'',
				aisort:'timestamp',
				aiuser:user,
				ailimit:'max'
			},
			(aistart&&typeof(aistart)!='undefined'&&aistart!=''?{aistart:aistart}:{})
		),
		function(data){
			uploads=uploads.concat($.map(data.query.allimages,function(e){
				return [e.name.replace(/_/g,' ')];
			}));
			if(data['query-continue']&&data['query-continue'].allimages&&data['query-continue'].allimages.aistart){
				getUploads(user,callback,data['query-continue'].allimages.aistart);
			}
			else{
				callback(uploads);
				return;
			}
		},
		'jsonp'
	);
}
function getData(callback,ucstart){
	var config={
		action:'query',
		format:'json',
		list:'usercontribs',
		ucuser:user,
		ucprop:'title|timestamp|comment|tags|ids|sizediff',
		uclimit:'max'
	};
	if(typeof ucstart!='undefined'&&ucstart!='') config.ucstart=ucstart;
	else{
		config.list+='|users';
		config.ususers=user;
		config.usprop='editcount';
	}
	$.get(
		api,
		config,
		function(data){
			contribs=contribs.concat(data.query.usercontribs);
			if(data.query.users) editcount=data.query.users[Object.keys(data.query.users)[0]].editcount;
			if(data['query-continue']&&data['query-continue'].usercontribs&&data['query-continue'].usercontribs.ucstart){
				getData(callback,data['query-continue'].usercontribs.ucstart);
			}
			else{
				callback(contribs);
				return;
			}
		},
		'jsonp'
	);
}
function getMessages(other,callback){
	$.get(
		api,
		{
			action:'query',
			format:'json',
			meta:'allmessages',
			amlang:navigator.language,
			ammessages:weekdays.concat(weekdaysShort).concat(months).concat(other).join('|')
		},
		function(data){
			callback(data.query.allmessages);
		},
		'jsonp'
	);
}
function getRights(callback){
	$.get(
		api,
		{
			action:'query',
			format:'json',
			list:'logevents',
			letype:'rights',
			letitle:'User:'+user,
			ledir:'newer',
			lelimit:'max'
		},
		function(data){
			callback($.grep(data.query.logevents,function(el){
				// hack for old log entries
				return typeof el.rights!='undefined';
			}));
		},
		'jsonp'
	);
}
function getBlockInfo(callback){
	$.get(
		api,
		{
			action:'query',
			format:'json',
			list:'users',
			ususers:user,
			usprop:'blockinfo'
		},
		function(data){
			var blk=data.query.users[0];
			callback(blk);
		},
		'jsonp'
	);
}
function getVotes(callback){
	var polls={
		'Wikivoyage/Logo/2013/R1/Results/JSON':'2013 Wikivoyage logo elections - 1st round',
		'Wikivoyage/Logo/2013/R2/Results/JSON':'2013 Wikivoyage logo elections - 2nd round'
	};
	$.get(
		'//meta.wikimedia.org/w/api.php',
		{
			action:'query',
			format:'json',
			titles:Object.keys(polls).join('|'),
			prop:'revisions',
			rvprop:'content'
		},
		function(data){
			$.each(data.query.pages,function(pageid,page){
				var votes=JSON.parse(page.revisions[0]['*'].replace(/^\<nowiki\>|\<\/nowiki\>$/g,''));
				if(typeof votes[user]=='undefined') votes=[];
				else votes=votes[user].votes.votesByTimestamp;
				polls[page.title]={label:polls[page.title],votes:votes};
			});
			callback(polls);
		},
		'jsonp'
	);
}
function getGeo(contribs,callback){
	var occurr={};
	$.each(contribs,function(key,val){
		if(typeof occurr[val.title]=='undefined') occurr[val.title]=val;
		else{
			if(typeof occurr[val.title].revid=='undefined'){
				occurr[val.title].count+=1;
				occurr[val.title].sizediff+=val.sizediff;
			}
			else occurr[val.title]={count:2,sizediff:occurr[val.title].sizediff+val.sizediff};
		}
	});
	var geodata={},
	titles=Object.keys(occurr),
	getGeodata=function(cb){
		$.get(
			api,
			{
				action:'query',
				prop:'coordinates',
				format:'json',
				titles:titles.splice(0,50).join('|')
			},
			function(data){
				$.extend(geodata,data.query.pages);
				if(titles.length>0) getGeodata(cb);
				else cb(geodata);
			},
			'jsonp'
		);
	}
	getGeodata(function(coords){
		var markers=[];
		$.each(coords,function(pageid,page){
			if(typeof page.coordinates!='undefined'){
				var coordinates=page.coordinates;
				if(coordinates.length==1){
					coordinates=coordinates[0];
					var edits=occurr[page.title],
					numedits=(typeof edits.revid=='undefined'?edits.count:1),
					marker={coords:coordinates,title:page.title,sizediff:edits.sizediff,numedits:numedits};
					if(typeof edits.revid!='undefined') $.extend(marker,{revid:edits.revid});
					markers.push(marker);
				}
			}
		});
		markers.sort(function(a,b){
			return b.numedits-a.numedits;
		});
		callback(markers);
	});
}
function getFilteredByDay(contribs){
	var contr={};
	for(j=0;j<7;j++){
		contr[j]=filterByDay(contribs,j).length;
	}
	return contr;
}
function getFilteredByHour(contribs){
	var contr=[];
	for(j=0;j<24;j++){
		contr=contr.concat(filterByHour(contribs,j).length);
	}
	return contr;
}
function getFilteredByTag(contribs){
	var contr={};
	$.each(contribs,function(i,e){
		if(e.tags&&e.tags.length==1){
			if(contr[e.tags[0]]) contr[e.tags[0]].push(e);
			else contr[e.tags[0]]=[e];
		}
		else if(!e.tags||e.tags.length==0){
			if(contr['none']) contr['none'].push(e);
			else contr['none']=[e];
		}
	});
	return {
		legend: $.map(Object.keys(contr),function(tag){
			var l=contr[tag].length;
			return tag+': '+l+' edit'+(l==1?'':'s')+' ('+Math.floor(l/contribs.length*10000)/100+'%)';
		}),
		data: $.map(Object.keys(contr),function(tag){
			return contr[tag].length;
		})
	};
}
function yearMonth(date){
	var month=(date.getUTCMonth()+1).toString();
	if(month.length===1) month='0'+month;
	return date.getUTCFullYear()+'/'+month;
}
function getFilteredByMonth(contribs){
	var contr={},s={};
	$.each(contribs,function(i,e){
		var date=new Date(e.timestamp),
		code=yearMonth(date);
		if(typeof contr[code]=='undefined') contr[code]=[e];
		else contr[code].push(e);
	});
	$.each(allMonths(),function(i,e){
		if(typeof contr[e]=='undefined') s[e]=[];
		else s[e]=contr[e];
	});
	return s;
}
function getFilteredByNS(contribs,alsoEmpty){
	if(typeof alsoEmpty=='undefined') alsoEmpty=false;
	var contr={};
	$.each($.map(namespaces,function(e){return e;}),function(nsIndex,ns){
		var f=filterByNS(contribs,ns.id);
		if(f.length>0||alsoEmpty===true) contr[ns.id]=f;
	});
	return contr;
}
function getFilteredByMonthNS(contribs){
	var contr={};
	$.each(getFilteredByMonth(contribs),function(k,v){
		contr[k]=getFilteredByNS(v,true);
	});
	return contr;
}
function getFilteredByNSMonth(contribs){
	var contr={};
	$.each(getFilteredByNS(contribs,true),function(k,v){
		contr[k]=getFilteredByMonth(v);
	});
	return contr;
}

/* filter contributions by presence of edit summary */
function getSummaried(contribs){
	return $.grep(contribs,function(e){
		return e.comment&&e.comment.trim()!='';
	});
}

function dateDiff(olddate,newdate,precision,ago){
	var labels=[
		messages['years'],
		messages['months'],
		messages['weeks'],
		messages['days'],
		messages['hours'],
		messages['minutes'],
		messages['seconds']
	];
	var mult=[12,4.34,7,24,60,60,1000],
	diff=(newdate||new Date())-olddate,
	message=[];
	$.each(mult,function(i,e){
		if(typeof precision=='undefined'||precision==null||i<=precision||message.length===0){
			var f=parseInt(eval(mult.slice(i).join('*')));
			if(Math.floor(diff/f)>0){
				message.push(parseMsg(labels[i],Math.floor(diff/f)));
				diff-=Math.floor(diff/f)*f;
			}
		}
	});
	return message.length>0?(ago===true?messages.ago.replace(/\$1/g,prettyJoin(message)):prettyJoin(message)):messages['just-now'];
}
function namespaceFromColor(color){
	color=color.toLowerCase().replace(/^\#/,'');
	for(ns in colors){
		if(colors[ns].toLowerCase().replace(/^\#/,'')===color) return ns;
	}
}
function parseMsg(msg,val){
	return (typeof msg=='string'?msg:(messages.seconds[0]+(val==1?msg[1]:msg[2])+msg[3])).replace(/\$1/g,val);
}
function filterByNS(contribs,ns){
	return $.grep(contribs,function(e){
		return e.ns==ns;
	});
}
function filterByDay(contribs,number){
	return $.grep(contribs,function(e){
		return new Date(e.timestamp).getUTCDay()===number;
	});
}
function filterByHour(contribs,number){
	return $.grep(contribs,function(e){
		return new Date(e.timestamp).getUTCHours()===number;
	});
}
function namespaceName(number){
	return namespaces[number]?namespaces[number]['*'].replace(/^(Talk)?$/,'Article $1').trim():('ns-'+number);
}
function topEdited(contribs,ns){
	var c=contribs;
	if(typeof ns!='undefined') c=filterByNS(c,ns);
	var titles=$.map(c,function(e){return [e.title];});
	var occurr={};
	$.each(titles,function(i,e){
		if(occurr[e]) occurr[e]=occurr[e]+1;
		else occurr[e]=1;
	});
	var sortedKeys=Object.keys(occurr).sort(function(a,b){
		return ((occurr[a] > occurr[b]) ? -1 : ((occurr[a] < occurr[b]) ? 1 : 0));
	}),
	overflow=false;
	if(sortedKeys.length>30){
		overflow=true;
		sortedKeys=sortedKeys.slice(0,30);
	}
	var sortedOccurr={};
	$.each(sortedKeys,function(i,e){
		sortedOccurr[e]=occurr[e];
	});
	return [sortedOccurr,overflow];
}
function sameOrNext(d1,d2){
	return d1===d2||d2-d1==86400000;
}

/* compute the longest sequence of consecutive days with contributions */
function longestStreak(contribs){
	var prev=[],cur=[],cc=contribs.slice(0);
	cc.reverse();
	$.each(cc,function(i,ct){
		var d=new Date(ct.timestamp).setHours(0,0,0,0);
		if(cur.length==0){
			cur[0]=d;// start streak
		}
		else if(cur.length==1){
			if(sameOrNext(cur[0],d)) cur[1]=d;// continue streak
			else cur=[];
		}
		else if(cur.length==2){
			if(i<cc.length&&sameOrNext(cur[1],d)) cur[1]=d;// continue streak
			else{// streak broken
				if(prev.length==0||cur[1]-cur[0]>prev[1]-prev[0]) prev=cur;// (over)write longest streak
				cur=[];// reset current streak anyway
			}
		}
	});
	return prev;
}

function allMonths(from){
	if(typeof from=='undefined') from=firstMonth;
	from=from.split('/');
	var fromYear = parseInt(from[0]), fromMonth = parseInt(from[1])-1, months = [], toYear = new Date().getUTCFullYear(), toMonth = new Date().getUTCMonth();
	for(year=fromYear;year<=toYear;year++){
		for(month=(year==fromYear?fromMonth:0);month<=(year==toYear?toMonth:11);month++){
			var m=(month+1).toString();
			months.push(year+'/'+(m.length==1?'0':'')+m);
		}
	}
	return months;
}
function prettyJoin(array){
	switch(array.length){
		case 0:return '';break;
		case 1:return array[0];break;
		case 2:return array.join(' and ');break;
		default:return array.slice(0,-1).join(', ')+', and '+array[array.length-1];break;
	}
}
function init(){
	var editCounterInitDate=new Date();
	getNamespaces(function(namespaces){
		window.namespaces=namespaces;
		var newmsg=$('[data-msg]').map(function(){return this.dataset.msg;}).get().concat(["ago","just-now","seconds","minutes","hours","days","weeks","months","years"]);
		getRights(function(rights){
			$('#rights')
			.append(
				rights.length==0?'<h3>No log entries found.</h3>':$('<ul>')
				.append($.map(rights,function(logevt){
					var oldgroups=logevt.rights.old.split(', '),
					newgroups=logevt.rights.new.split(', '),
					added=$.grep(newgroups,function(el){return el!=''&&oldgroups.indexOf(el)==-1;}),
					removed=$.grep(oldgroups,function(el){return el!=''&&newgroups.indexOf(el)==-1;});
					var msg=[];
					if(added.length>0) msg.push('became '+prettyJoin($.map(added,rightColor)));
					if(removed.length>0) msg.push('removed '+prettyJoin($.map(removed,rightColor)));
					return $('<li>').html('<a href="'+wikipath+'Special:Log/'+logevt.logid+'">'+new Date(logevt.timestamp).toLocaleString()+'</a>: '+prettyJoin(msg));
				}))
			);
			getMessages(newmsg,function(msg){
				messages={};
				$.each(msg,function(i,v){
					messages[v['name']]=v['*'];
					if(v['*'].indexOf('{{PLURAL')!=-1){
						var s=v['*'].match(/^(.*)\{\{PLURAL: ?\$1\|([^\|]*)(\|([^\|]*))?\}\}(.*)$/).slice(1);
						s.splice(2,1);
						if(typeof s[2]=='undefined') s[2]='';
						messages[v['name']]=s;
					}
				});
				months=$.map(months,function(el){return messages[el];});
				weekdays=$.map(weekdays,function(el){return messages[el];});
				weekdaysShort=$.map(weekdaysShort,function(el){return messages[el];});
				weekdaysAlt=weekdays.slice(1).concat(weekdays[0]).reverse();
				$('[data-msg]').each(function(){
					$(this).text(messages[this.dataset.msg]);
				});
				getData(function(contribs){
					var firstContribDate=new Date(contribs[contribs.length-1].timestamp),
					latestContribDate=new Date(contribs[0].timestamp),
					filtered=getFilteredByNS(contribs,true),
					nsNumbers=Object.keys(filtered),
					nsNames=$.map(nsNumbers,function(e){return namespaceName(e)+': '+filtered[e].length+' ('+Math.floor(filtered[e].length/contribs.length*10000)/100+'%)';}),
					nsContribs=$.map(filtered,function(e){return e.length;}),
					nsColors=$.map(nsNumbers.sort(function(a,b){return filtered[b].length-filtered[a].length;}),function(e){return ['#'+colors[e]];});
					firstMonth=yearMonth(firstContribDate);
					$('.hero-unit').removeClass('hero-unit');
					$('#form').remove();
					var nsCanvas = Raphael('ns-chart',520,400),
					nsChart = nsCanvas.piechart(170, 200, 150, nsContribs, { legend: nsNames, legendpos: 'east', colors: nsColors, minPercent: 0 })
					.hover(function () {
						this.sector.stop();
						if(!this.sector[0].classList.contains('selected')) this.sector.scale(1.1, 1.1, this.cx, this.cy);
						if (this.label) {
							this.label[0].stop();
							this.label[0].attr({ r: 7.5 });
							this.label[1].attr({ 'font-weight': 800 });
						}
					}, function () {
						if(!this.sector[0].classList.contains('selected')) this.sector.animate({ transform: 's1 1 ' + this.cx + ' ' + this.cy }, 500, 'bounce');
						if (this.label) {
							this.label[0].animate({ r: 5 }, 500, 'bounce');
							this.label[1].attr({ 'font-weight': 400 });
						}
					})
					.click(function () {
						this.sector.stop();
						this.sector.attr({transform:'s1 1 ' + this.cx + ' ' + this.cy });
						if(this.sector[0].classList.contains('selected')){
							this.sector[0].classList.remove('selected');
							$('#top-edited').hide('fast');
							nsCanvas.canvas.setAttribute('width',520);
						}
						else{
							nsCanvas.canvas.setAttribute('width',340);
							nsChart.each(function(){
								this.sector.attr({transform:'s1 1 ' + this.cx + ' ' + this.cy });
								this.sector[0].classList.remove('selected');
							});
							this.sector.scale(1.1, 1.1, this.cx, this.cy);
							this.sector[0].classList.add('selected');					
							var ns = this.value.order,
							fff = console.log(ns),
							te = topEdited(contribs,ns);
							$('#top-edited')
							.empty()
							.append(
								$('<h2>')
								.text((te[1]?'Top ':'')+Object.keys(te[0]).length+' edited page'+(Object.keys(te[0]).length==1?'':'s')+' in namespace "'+namespaceName(ns)+'"')
							)
							.append(
								$('<ul>').append(
									$.map(te[0],function(v,k){
										return $('<a>')
										.text(k)
										.attr('href',wikipath+k)
										.appendTo('<li>'+v+' - </li>')
										.parent();
									})
								)
							).show('fast');
						}
					} ) ;
					var dayColors = ['#4d89f9','#c6d9fd'],
					dayFiltered = $.map(getFilteredByDay(contribs),function(e){return [e];});
					while(dayColors.length<dayFiltered.length){
						dayColors=dayColors.concat(dayColors.slice(0,2)).slice(0,dayFiltered.length);
					}
					var weekCanvas = Raphael('week-chart'),
					fin = function () {
						this.flag = weekCanvas.popup(this.bar.x, this.bar.y, this.bar.value || '0', 'up').insertBefore(this);
					},
					fin2 = function () {
						this.flag = weekCanvas.popup(this.bar.x, this.bar.y, namespaceName(namespaceFromColor(this.bar.attrs.fill))+': '+this.bar.value || '0', 'right').insertBefore(this);
					},
					fout = function () {
						this.flag.animate({opacity: 0}, 100, function () {this.remove();});
					},
					weekChart = weekCanvas.barchart(0, 20, 400, 300, dayFiltered, { colors: dayColors }).hover(fin, fout);
					
					/* Tags chart */
					$('li>a[href="#tags"]').one('shown',function(){
						var tagsData = getFilteredByTag(contribs),
						tagsCanvas = Raphael('tag-chart',750,600),
						tagsChart = tagsCanvas.piechart(220, 220, 180, tagsData.data, { legend: tagsData.legend, minPercent: 0 });
					});
					
					/* GitHub-like Punchcard */
					var punch=$.map([1,2,3,4,5,6,0],function(j){
						return getFilteredByHour(filterByDay(contribs,j));
					});
					$('li>a[href="#punch-card"]').one('shown',function(){
						var r = Raphael('punchcard',1200,500),
						xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
						ys = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
						r.dotchart(10, 0, 1200, 500, xs, ys, punch, {
							symbol: 'o',
							max: 21,
							axis: '0 0 1 1',
							axisxstep: 23,
							axisystep: 6,
							axisxlabels: ['12am', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12pm', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
							axisxtype: ' ',
							axisytype: ' ',
							axisylabels: weekdaysAlt,
							init: true
						}).hover(function () {
							var self=this;
							var s=$('circle').filter(function(){
								return parseInt(self.x)==parseInt(this.getAttribute('cx'))&&
								parseInt(self.y)==parseInt(this.getAttribute('cy'));
							});
							try{
								s.get(0).classList.add('day-hover');
								s.get(1).style.zIndex=0;
								this.flag = r.popup(this.x, this.y-this.r, this.value+' edit'+(this.value==1?'':'s') || '0', 'up', 8).insertBefore(this);
							}catch(e){}
						},function () {
							var self=this;
							var s=$('circle').filter(function(){
								return parseInt(self.x)==parseInt(this.getAttribute('cx'))&&
								parseInt(self.y)==parseInt(this.getAttribute('cy'));
							});
							try{
								s.get(0).classList.remove('day-hover');
								s.get(1).style.zIndex=null;
								this.flag.animate({opacity: 0}, 100, function () {this.remove();});
							}catch(e){}
						});
					});
					var hideCreditsOnShow=$('li>a[href="#map"],li>a[href="#votes"]');
					hideCreditsOnShow.on('show',function(){
						$('#credits').hide();
					});
					$('a[data-toggle="tab"]').not(hideCreditsOnShow).on('show',function(){
						$('#credits').show();
					});
					$('li>a[href="#map"]')
					.one('shown',function(){
						$('#map').append('Loading geodata...');
						var colors=['bisque','black','blue','coral','cyan','darkslategray','deeppink','green','lightgrey','lime','magenta','orange','purple','red','teal','yellow'];
						getGeo(filterByNS(contribs,0).concat(filterByNS(contribs,6)),function(geodata){
							if(geodata.length>0){
								$('#map').empty().css('height','400px');
								var maxedits=geodata[0].numedits,
								map = L.map('map').setView([0,0],2);
								new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 2, maxZoom: 18, attribution: 'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
								$.each(geodata,function(index,marker){
									var sizediff=marker.sizediff,
									sizedifftag=Math.abs(sizediff)>500?'strong':'span',
									iconSize=Math.max(9,marker.numedits/maxedits*22),
									sizediff='<'+sizedifftag+' class="mw-plusminus-'+(sizediff==0?'null':(sizediff>0?'pos':'neg'))+'">'+(sizediff>0?'+':'')+sizediff+' byte'+(sizediff==1?'':'s')+'</'+sizedifftag+'>';
									if(typeof marker.revid!='undefined') var edits='<a href="'+wikipath+'?diff='+marker.revid+'">1 edit</a>';
									else var edits=marker.numedits+' edits';
									L.marker(marker.coords,{
										icon:L.icon({
											iconUrl:'//commons.wikimedia.org/wiki/Special:Filepath/Location_dot_'+colors[Math.floor(Math.random()*colors.length)]+'.svg',
											iconSize:[iconSize,iconSize]
										})
									}).addTo(map).bindPopup('<strong><a href="'+wikipath+marker.title+'">'+marker.title+'</a></strong><br>'+sizediff+' with '+edits);
								});
							}
							else $('#map').empty().append('<h3>Hey! No geo data here ;(</h3>');
						});
					});
					$('footer').show();
					var byMonth=getFilteredByMonth(contribs),
					axisData=$.map(Object.keys(byMonth),function(e){return byMonth[e].length.toString();}).reverse(),
					filtered=getFilteredByNSMonth(contribs),
					nsNumbers=Object.keys(filtered),
					nsNames=$.map(nsNumbers,function(e){return namespaceName(e);}),
					nsData=$.map(filtered,function(months){
						return [$.map(months,function(c){
							return c.length;
						})];
					});
					var nsColors=$.map(nsNumbers,function(e){return '#'+colors[e];}),
					axisLabels=Object.keys(filtered[Object.keys(filtered)[0]]).reverse(),
					mSize = 24.5*Object.keys(byMonth).length,
					monthsCanvas = Raphael('month-chart',1200,mSize),
					monthsChart = monthsCanvas.hbarchart(75, 0, 850, mSize, nsData, { stacked: true, colors: nsColors }).hover(fin2, fout);
					$('li>a[href="#advanced"]').one('shown',function(){
						Raphael.g.axis(31,320,331,0,7,6,2,weekdaysShort,' ',null,weekCanvas);
						var aY = monthsChart.bars[0][monthsChart.bars[0].length -1].y;
						var aH = aY - monthsChart.bars[0][0].y;
						console.log(aY+'\n'+aH);
						console.log(monthsChart.bars[0]);
						Raphael.g.axis(50, aY-1.8, aH, 0, axisLabels.length, axisLabels.length-1, 1, axisLabels, ' ', null, monthsCanvas)
						.text.attr({'font-weight':'bold'});
						Raphael.g.axis(60, aY-1.8, aH, 0, axisData.length, axisData.length-1, 1, axisData, ' ', null, monthsCanvas)
						.text.attr({'text-anchor':'start'});
					});
					var ls=longestStreak(contribs),
					summ=getSummaried(contribs).length;
					getVotes(function(polls){
						console.log(polls);
						$('#votes')
						.append($.map(polls,function(poll,page){
							return [
								$('<h3>').append($('<a>',{'href':'//meta.wikimedia.org/wiki/'+page,'title':page}).text(poll.label)),
								poll.votes.length>0?$('<ul>')
								.append($.map(poll.votes,function(vote){
									return $('<li>').text(new Date(vote.ts).toUTCString()+' - Voted for '+vote.candidate+' (')
									.append($('<a>',{'href':'//meta.wikimedia.org/wiki/?diff='+vote.diff,'title':'diff '+vote.diff+' on Meta-Wiki'}).text('diff'))
									.append(')');
								})):'Did not vote.'
							];
						}));
						getUploads(function(uploads){
							getBlockInfo(function(blockinfo){
								$('#general')
								.append(typeof blockinfo.blockid!='undefined'?('<strong>Currently blocked by '+blockinfo.blockedby+' with an expiry time of '+blockinfo.blockexpiry+' because "<i>'+blockinfo.blockreason+'</i>"<br>'):'')
								.append('<a href="'+wikipath+'?diff='+contribs[contribs.length-1].revid+'">First edit</a>: '+firstContribDate.toUTCString()+' ('+dateDiff(firstContribDate,new Date(),4,true)+')<br>')
								.append('<a href="'+wikipath+'?diff='+contribs[0].revid+'">Most recent edit</a>: '+latestContribDate.toUTCString()+' ('+dateDiff(latestContribDate,new Date(),5,true)+')<br>')
								.append('Live edits: '+contribs.length.toLocaleString()+'<br>')
								.append(typeof editcount=='undefined'?[]:['Deleted edits: '+(editcount-contribs.length).toLocaleString(),'<br>',
								'<b>Total edits (including deleted): '+editcount.toLocaleString()+'</b>','<br>'])
								.append('<a href="'+wikipath+'Special:Log/upload?user='+user+'">'+messages['statistics-files']+'</a>: '+uploads.length.toLocaleString()+'<br>')
								.append('Edits with non-empty summary: '+summ.toLocaleString()+' ('+
								Math.floor((summ/contribs.length)*10000)/100+'%)<br>')
								.append('Longest streak: '+$.map(ls,function(d){return new Date(d).toUTCString()}).join(' - ')+': '+parseMsg(messages.days,(new Date(ls[1])-new Date(ls[0]))/86400000+1)+'<br>')
								.append('Executed in '+parseMsg(messages.seconds,Math.floor((new Date().getTime()-editCounterInitDate.getTime())/10)/100)+'.');
							});
						});
					});
				});
			});
		});
	});
}
$(document).ready(function(){
	$('#init').click(function(event){
		event.preventDefault();
		$(this).replaceWith('I warned you! Wait...');
		window.wikipath='//'+$('#p').val()+'.org/wiki/';
		window.api='//'+$('#p').val()+'.org/w/api.php';
		window.user=$('#u').val();
		init();
	});
});
