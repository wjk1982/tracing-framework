/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Query virtualized table source.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('wtf.app.ui.query.QueryTableSource');

goog.require('wtf.analysis.Event');
goog.require('wtf.analysis.Scope');
goog.require('wtf.analysis.db.EventDatabase');
goog.require('wtf.analysis.db.ZoneIndex');
goog.require('wtf.ui.VirtualTableSource');



/**
 * Virtual table data source wrapping the query results.
 *
 * @param {?wtf.analysis.db.QueryResultType} queryResult Query result.
 * @constructor
 * @extends {wtf.ui.VirtualTableSource}
 */
wtf.app.ui.query.QueryTableSource = function(queryResult) {
  goog.base(this);

  /**
   * Query result.
   * @type {?wtf.analysis.db.QueryResultType}
   * @private
   */
  this.result_ = queryResult;

  var rows = null;
  if (typeof queryResult == 'boolean' ||
      typeof queryResult == 'number' ||
      typeof queryResult == 'string') {
    rows = [queryResult];
  } else if (
      !queryResult || (goog.isArray(queryResult) && !queryResult.length)) {
    // Nothing matched.
    rows = [];
  } else if (goog.isArray(queryResult)) {
    // List of results.
    rows = queryResult;
  } else {
    // Single entry (event/etc).
    rows = [queryResult];
  }
  this.setRowCount(rows.length);

  /**
   * All rows.
   * @type {!Array.<string|number|boolean|wgxpath.Node>}
   * @private
   */
  this.rows_ = rows;
};
goog.inherits(wtf.app.ui.query.QueryTableSource, wtf.ui.VirtualTableSource);


/**
 * @override
 */
wtf.app.ui.query.QueryTableSource.prototype.paintRowRange = function(
    ctx, bounds, scrollBounds, rowOffset, rowHeight, first, last) {
  ctx.font = '11px monospace';
  var charWidth = ctx.measureText('0').width;
  var charHeight = 11;
  var rowCenter = rowHeight / 2 + 10 / 2;

  // Gutter.
  // TODO(benvanik): move into table as an option?
  var gutterWidth = 60;
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, gutterWidth, bounds.height);
  var y = rowOffset;
  for (var n = first; n <= last; n++, y += rowHeight) {
    var line = String(n);
    ctx.fillStyle = 'black';
    ctx.fillText(
        line,
        gutterWidth - ((line.length + 1) * charWidth),
        Math.floor(y + rowCenter));
  }
  ctx.fillStyle = '#dddddd';
  ctx.fillRect(gutterWidth - 1, 0, 1, bounds.height);

  // Draw row contents.
  y = rowOffset;
  for (var n = first; n <= last; n++, y += rowHeight) {
    ctx.fillStyle = n % 2 ? '#fafafa' : '#ffffff';
    ctx.fillRect(gutterWidth, y, bounds.width - gutterWidth, rowHeight);

    // TODO(benvanik): icons to differentiate event types?

    var column0 = null;

    ctx.fillStyle = 'black';
    var value = this.rows_[n];
    if (typeof value == 'boolean' ||
        typeof value == 'number' ||
        typeof value == 'string') {
      // Primitive.
      column0 = String(value);
    } else {
      // Some node.
      if (value instanceof wtf.analysis.Scope) {
        column0 = value.getName();
      } else if (value instanceof wtf.analysis.Event) {
        column0 = value.getEventType().getName();
      } else if (value instanceof wgxpath.Attr) {
        var attrkey = value.getNodeName();
        var attrvalue = value.getNodeValue();
        column0 = attrkey + ': ' + attrvalue;
      } else if (value instanceof wtf.analysis.db.ZoneIndex) {
        column0 = value.getZone().getName();
      } else if (value instanceof wtf.analysis.db.EventDatabase) {
        column0 = 'db';
      }
    }

    ctx.fillText(
        column0,
        gutterWidth + charWidth,
        Math.floor(y + rowCenter));
  }
};


// TODO(benvanik): hover attribute shows parent event tooltip, click goes to
//     parent event
// TODO(benvanik): if attr value is a URL, add an 'open' link
// TODO(benvanik): onclick handler sends to event in timeline
// TODO(benvanik): onhover sets indicator on navbar