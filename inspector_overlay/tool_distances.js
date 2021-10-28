//  Copyright 2019 The Chromium Authors. All rights reserved.
//  Use of this source code is governed by a BSD-style license that can be
//  found in the LICENSE file.
import { Overlay } from './common.js';
export class DistancesOverlay extends Overlay {
    drawDistances({ distanceInfo }) {
        if (!distanceInfo) {
            return;
        }
        const rect = quadToRect(getVisualQuad(distanceInfo));
        this.context.save();
        this.context.strokeStyle = '#ccc';
        for (const box of distanceInfo.boxes) {
            this.context.strokeRect(box[0], box[1], box[2], box[3]);
        }
        this.context.strokeStyle = '#f00';
        this.context.lineWidth = 1;
        this.context.rect(rect.x - 0.5, rect.y - 0.5, rect.w + 1, rect.h + 1);
        this.context.stroke();
        this.context.restore();
    }
    install() {
        this.document.body.classList.add('fill');
        const canvas = this.document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.classList.add('fill');
        this.document.body.append(canvas);
        this.setCanvas(canvas);
        super.install();
    }
    uninstall() {
        this.document.body.classList.remove('fill');
        this.document.body.innerHTML = '';
        super.uninstall();
    }
}
function getVisualQuad(data) {
    const style = data['style'];
    if (shouldUseVisualBorder(style)) {
        return data['border'];
    }
    if (shouldUseVisualPadding(style)) {
        return data['padding'];
    }
    return data['content'];
    function shouldUseVisualBorder(style) {
        const sides = ['top', 'right', 'bottom', 'left'];
        for (const side of sides) {
            const borderWidth = style[`border-${side}-width`];
            const borderStyle = style[`border-${side}-style`];
            const borderColor = style[`border-${side}-color`];
            if (borderWidth !== '0px' && borderStyle !== 'none' && !borderColor.endsWith('00')) {
                return true;
            }
        }
        const outlineWidth = style['outline-width'];
        const outlineStyle = style['outline-style'];
        const outlineColor = style['outline-color'];
        if (outlineWidth !== '0px' && outlineStyle !== 'none' && !outlineColor.endsWith('00')) {
            return true;
        }
        const boxShadow = style['box-shadow'];
        if (boxShadow !== 'none') {
            return true;
        }
        return false;
    }
    function shouldUseVisualPadding(style) {
        const bgColor = style['background-color'];
        const bgImage = style['background-image'];
        if (!bgColor.startsWith('#FFFFFF') && !bgColor.endsWith('00')) {
            return true;
        }
        if (bgImage !== 'none') {
            return true;
        }
        return false;
    }
}
function quadToRect(quad) {
    return { x: quad[0], y: quad[1], w: quad[4] - quad[0], h: quad[5] - quad[1] };
}
//# sourceMappingURL=tool_distances.js.map