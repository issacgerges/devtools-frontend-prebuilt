// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// IMPORTANT: this file is auto generated. Please do not edit this file.
/* istanbul ignore file */
const styles = new CSSStyleSheet();
styles.replaceSync(
`/*
 * Copyright 2021 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/**
* Reset default UA styles for focused elements.
* The button styles below explicitly implement custom focus styles.
*/
*:focus,
*:focus-visible,
:host(:focus),
:host(:focus-visible) {
  outline: none;
}

:host {
  display: inline-flex;
  flex-direction: row;
}

button {
  align-items: center;
  border-radius: 4px;
  display: inline-flex;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  height: 24px;
  line-height: 14px;
  padding: 5px 12px;
  justify-content: center;
  width: 100%;
}

button.small {
  height: 18px;
  border-radius: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 2px var(--color-button-outline-focus);
}

button:hover {
  cursor: pointer;
}

button.toolbar {
  background: transparent;
  border-radius: 2px;
  border: none;
  height: 24px;
  width: 24px;
  overflow: hidden;
  padding: 0;
  white-space: nowrap;
}

button.toolbar.small {
  height: 18px;
  width: 18px;
}

button.primary {
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-background);
}

button.primary:hover {
  background: var(--color-button-primary-background-hovering);
  border: 1px solid var(--color-button-primary-background-hovering);
}

button.primary:active {
  background: var(--color-button-primary-background-pressed);
  border: 1px solid var(--color-button-primary-background-pressed);
}

button.primary:disabled,
button.primary:disabled:hover {
  border: 1px solid transparent;
  background: var(--color-background-elevation-1);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

button.secondary {
  border: 1px solid var(--color-details-hairline);
  background: var(--color-background);
  color: var(--color-primary);
}

button.secondary:hover {
  background: var(--color-button-secondary-background-hovering);
}

button.secondary:active {
  background: var(--color-button-secondary-background-pressed);
  border: 1px solid var(--color-button-secondary-background-pressed);
}

button.secondary:focus-visible {
  border: 1px solid var(--color-background);
}

button.secondary:disabled,
button.secondary:disabled:hover {
  border: 1px solid var(--color-background-elevation-1);
  background: var(--color-background);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

button.secondary:active:focus-visible {
  border: 1px solid var(--color-button-secondary-background-pressed);
}

button.toolbar:hover {
  background-color: var(--color-button-secondary-background-hovering);
}

button.toolbar:active {
  background-color: var(--color-button-secondary-background-pressed);
}

button.toolbar:focus-visible {
  background-color: var(--color-background-elevation-2);
}

button.toolbar:disabled,
button.toolbar:disabled:hover {
  border: 1px solid transparent;
  background: var(--color-background);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

button.text-with-icon {
  padding: 0 12px 0 4px;
}

button.small.text-with-icon {
  padding: 0 9px 0 3px;
}

button.only-icon {
  padding: 0;
}

button devtools-icon {
  width: 19px;
  height: 19px;
}

button.toolbar devtools-icon {
  width: 24px;
  height: 24px;

  --icon-color: var(--color-text-primary);
}

button.primary devtools-icon {
  --icon-color: var(--color-background);
}

button.secondary devtools-icon {
  --icon-color: var(--color-primary);
}

button.small devtools-icon {
  width: 14px;
  height: 14px;
}

button.toolbar.small devtools-icon {
  width: 18px;
  height: 18px;
}

button.toolbar:disabled devtools-icon {
  --icon-color: var(--color-text-disabled);
}

button.primary:disabled devtools-icon {
  --icon-color: var(--color-text-disabled);
}

button.secondary:disabled devtools-icon {
  --icon-color: var(--color-text-disabled);
}

/*# sourceURL=button.css */
`);
export default styles;
