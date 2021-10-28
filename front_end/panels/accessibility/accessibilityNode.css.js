// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// IMPORTANT: this file is auto generated. Please do not edit this file.
/* istanbul ignore file */
const styles = new CSSStyleSheet();
styles.replaceSync(
`/*
 * Copyright 2017 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

.widget.ax-subpane {
  overflow-x: hidden;
  user-select: text;
}

.ax-ignored-info {
  padding: 6px;
}

.ax-ignored-node-pane {
  flex: none;
}

.invalid {
  text-decoration: line-through;
}

span.ax-value-undefined {
  font-style: italic;
}

.ax-value-source-unused {
  opacity: 70%;
}

.ax-value-source-superseded,
.ax-value-source-invalid {
  text-decoration: line-through;
}

.tree-outline span[is=dt-icon-label] {
  position: relative;
  left: -11px;
}

.tree-outline li {
  display: block;
  overflow-x: hidden;
  align-items: baseline;
}

.tree-outline li::before {
  content: "";
  width: 14px;
  display: inline-block;
}

.tree-outline li.property {
  color: var(--color-text-primary);
}

.tree-outline li.invalid {
  position: relative;
  left: -2px;
}

.tree-outline span[is=dt-icon-label] + .ax-name {
  margin-left: -11px;
}

.tree-outline li span {
  flex-shrink: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (forced-colors: active) {
  .ax-value-source-unused {
    opacity: 100%;
  }

  .tree-outline-disclosure:hover li.parent::before {
    background-color: ButtonText;
  }
}

/*# sourceURL=accessibilityNode.css */
`);
export default styles;
