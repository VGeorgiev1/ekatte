/* eslint-disable guard-for-in */
'use strict';
/**
 * Send an ajax request to the server with the search value.
 */
function search() {
  const val = $('#locality').val();
  if (val) {
    $.ajax({
      method: 'POST',
      url: '/search',
      data: {searchValue: val},
    }).then((res) => {
      $('#info').remove();
      $('tr').remove();
      const table = $('<table id="info">');
      const lables = $('<tr>');
      for (const key of res.lables) {
        lables.append($(`<td>${key}</td>`));
      }
      if (res != 'Error') {
        for (const locality of res.info) {
          const values = $('<tr>');
          for (const key in locality) {
            values.append($(`<td>${locality[key]}</td>`));
          }
          table.append(values);
        }
      }
      $('body').append(table.prepend(lables));
    });
  }
}
