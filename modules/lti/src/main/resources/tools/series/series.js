/* global $, Mustache */

'use strict';

var player,
    currentpage;

function getSeries() {
  var prefix = '?series=';
  if (location.search.startsWith(prefix)) {
    return location.search.substring(prefix.length).split('&')[0];
  }
  return '';
}

function loadDefaultPlayer() {
  var infoUrl = '/info/me.json';

  // load spinner
  $('main').html($('#template-loading').html());

  // get organization configuration
  return $.getJSON(infoUrl, function( data ) {
    player = data.org.properties.player;
  });
}

function loadPage(page) {

  var limit = 15,
      offset = (page - 1) * limit,
      series = getSeries(),
      url = '/search/episode.json?limit=' + limit + '&offset=' + offset;

  currentpage = page;

  // attach series query if a series is requested
  if (series) {
    url += '&sid=' + series;
  }

  // load spinner
  $('main').html($('#template-loading').html());

  $.getJSON(url, function( data ) {
    data = data['search-results'];
    var rendered = '',
        results = [],
        total = parseInt(data.total);

    if (total > 0) {
      results = Array.isArray(data.result) ? data.result : [data.result];
    }

    for (var i = 0; i < results.length; i++) {
      var episode = results[i],
          template = $('#template-episode').html(),
          tpldata = {
            player: player + '?id=' + episode.id,
            title: episode.dcTitle,
            creator: episode.dcCreator,
            created: episode.dcCreated};

      // get preview image
      var attachments = episode.mediapackage.attachments.attachment;
      attachments = Array.isArray(attachments) ? attachments : [attachments];
      for (var j = 0; j < attachments.length; j++) {
        if (attachments[j].type.endsWith('/search+preview')) {
          tpldata['image'] = attachments[j].url;
          break;
        }
      }

      // render template
      rendered += Mustache.render(template, tpldata);
    }

    // render episode view
    $('main').html(rendered);

    // render result information
    var resultTemplate = $('#template-results').html(),
        resultTplData = {
          total: total,
          range: {
            begin: Math.min(offset + 1, total),
            end: offset + parseInt(data.limit)
          }
        };
    $('header').html(Mustache.render(resultTemplate, resultTplData));

    // render pagination
    $('footer').pagination({
      dataSource: Array(total),
      pageSize: limit,
      pageNumber: currentpage,
      callback: function(data, pagination) {
        if (pagination.pageNumber != currentpage) {
          loadPage(pagination.pageNumber);
        }
      }
    });

  });

}

$(document).ready(function() {
  loadDefaultPlayer()
    .then(loadPage(1));
});
