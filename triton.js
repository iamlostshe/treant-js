/*
 * triton - fork of treant-js
 *
 * (c) 2013 Fran Peručić
 * treant-js may be freely distributed under the MIT license.
 * For all details and documentation:
 * http://fperucic.github.io/treant-js
 *
 * triton is an open-source JavaScipt library for visualization of tree diagrams.
 * It implements the node positioning algorithm of John Q. Walker II "Positioning nodes for General Trees".
 *
 * References:
 * Emilio Cortegoso Lobato: ECOTree.js v1.0 (October 26th, 2006)
 *
 * Contributors:
 * Fran Peručić, https://github.com/fperucic
 * Dave Goodchild, https://github.com/dlgoodchild
 */

; (() => {
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            return this.substr(position || 0, searchString.length) === searchString;
        };
    }

    var $ = null;

    var UTIL = {
        inheritAttrs: function (applyTo, applyFrom) {
            for (var attr in applyFrom) {
                if (Object.hasOwn(applyFrom, attr)) {
                    if ((applyTo[attr] instanceof Object && applyFrom[attr] instanceof Object) && (typeof applyFrom[attr] !== 'function')) {
                        this.inheritAttrs(applyTo[attr], applyFrom[attr]);
                    }
                    else {
                        applyTo[attr] = applyFrom[attr];
                    }
                }
            }
            return applyTo;
        },

        createMerge: function (obj1, obj2) {
            var newObj = {};
            if (obj1) {
                this.inheritAttrs(newObj, this.cloneObj(obj1));
            }
            if (obj2) {
                this.inheritAttrs(newObj, obj2);
            }
            return newObj;
        },

        extend: function () {
            if ($) {
                Array.prototype.unshift.apply(arguments, [true, {}]);
                return $.extend.apply($, arguments);
            }
            else {
                return UTIL.createMerge.apply(this, arguments);
            }
        },

        cloneObj: function (obj) {
            if (Object(obj) !== obj) {
                return obj;
            }
            var res = new obj.constructor();
            for (var key in obj) {
                if (Object.hasOwn(obj, key)) {
                    res[key] = this.cloneObj(obj[key]);
                }
            }
            return res;
        },

        addEvent: (el, eventType, handler) => {
            if ($) {
                $(el).on(eventType + '.triton', handler);
            }
            else if (el.addEventListener) {
                el.addEventListener(eventType, handler, false);
            }
            else if (el.attachEvent) {
                el.attachEvent('on' + eventType, handler);
            }
            else {
                el['on' + eventType] = handler;
            }
        },

        findEl: (selector, raw, parentEl) => {
            parentEl = parentEl || document;

            if ($) {
                var $element = $(selector, parentEl);
                return (raw ? $element.get(0) : $element);
            }
            else {
                if (selector.charAt(0) === '#') {
                    return parentEl.getElementById(selector.substring(1));
                }
                else if (selector.charAt(0) === '.') {
                    var oElements = parentEl.getElementsByClassName(selector.substring(1));
                    return (oElements.length ? oElements[0] : null);
                }

                throw new Error('Unknown container element');
            }
        },

        getOuterHeight: (element) => {
            var nRoundingCompensation = 1;
            if (typeof element.getBoundingClientRect === 'function') {
                return element.getBoundingClientRect().height;
            }
            else if ($) {
                return Math.ceil($(element).outerHeight()) + nRoundingCompensation;
            }
            else {
                return Math.ceil(
                    element.clientHeight
                    + UTIL.getStyle(element, 'border-top-width', true)
                    + UTIL.getStyle(element, 'border-bottom-width', true)
                    + UTIL.getStyle(element, 'padding-top', true)
                    + UTIL.getStyle(element, 'padding-bottom', true)
                    + nRoundingCompensation
                );
            }
        },

        getOuterWidth: (element) => {
            var nRoundingCompensation = 1;
            if (typeof element.getBoundingClientRect === 'function') {
                return element.getBoundingClientRect().width;
            }
            else if ($) {
                return Math.ceil($(element).outerWidth()) + nRoundingCompensation;
            }
            else {
                return Math.ceil(
                    element.clientWidth
                    + UTIL.getStyle(element, 'border-left-width', true)
                    + UTIL.getStyle(element, 'border-right-width', true)
                    + UTIL.getStyle(element, 'padding-left', true)
                    + UTIL.getStyle(element, 'padding-right', true)
                    + nRoundingCompensation
                );
            }
        },

        getStyle: (element, strCssRule, asInt) => {
            var strValue = "";
            if (document.defaultView && document.defaultView.getComputedStyle) {
                strValue = document.defaultView.getComputedStyle(element, '').getPropertyValue(strCssRule);
            }
            else if (element.currentStyle) {
                strCssRule = strCssRule.replace(/-(\w)/g,
                    (strMatch, p1) => p1.toUpperCase()
                );
                strValue = element.currentStyle[strCssRule];
            }
            return (asInt ? parseFloat(strValue) : strValue);
        },

        addClass: (element, cssClass) => {
            if ($) {
                $(element).addClass(cssClass);
            }
            else {
                if (!UTIL.hasClass(element, cssClass)) {
                    if (element.classList) {
                        element.classList.add(cssClass);
                    }
                    else {
                        element.className += " " + cssClass;
                    }
                }
            }
        },

        hasClass: (element, my_class) => (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(" " + my_class + " ") > -1,

        toggleClass: (element, cls, apply) => {
            if ($) {
                $(element).toggleClass(cls, apply);
            }
            else {
                if (apply) {
                    element.classList.add(cls);
                }
                else {
                    element.classList.remove(cls);
                }
            }
        },

        setDimensions: (element, width, height) => {
            if ($) {
                $(element).width(width).height(height);
            }
            else {
                element.style.width = width + 'px';
                element.style.height = height + 'px';
            }
        },
        isjQueryAvailable: () => (typeof ($) !== 'undefined' && $)
    };

    var ImageLoader = function () {
        this.reset();
    };

    ImageLoader.prototype = {
        reset: function () {
            this.loading = [];
            return this;
        },

        processNode: function (node) {
            var aImages = node.nodeDOM.getElementsByTagName('img');
            var i = aImages.length;
            while (i--) {
                this.create(node, aImages[i]);
            }
            return this;
        },

        removeAll: function (img_src) {
            var i = this.loading.length;
            while (i--) {
                if (this.loading[i] === img_src) {
                    this.loading.splice(i, 1);
                }
            }
            return this;
        },

        create: function (node, image) {
            var self = this, source = image.src;

            function imgTrigger() {
                self.removeAll(source);
                node.width = node.nodeDOM.offsetWidth;
                node.height = node.nodeDOM.offsetHeight;
            }

            if (image.src.indexOf('data:') !== 0) {
                this.loading.push(source);

                if (image.complete) {
                    return imgTrigger();
                }

                UTIL.addEvent(image, 'load', imgTrigger);
                UTIL.addEvent(image, 'error', imgTrigger);

                image.src += ((image.src.indexOf('?') > 0) ? '&' : '?') + new Date().getTime();
            }
            else {
                imgTrigger();
            }
        },

        isNotLoading: function () {
            return (this.loading.length === 0);
        }
    };

    var TreeStore = {
        store: [],

        createTree: function (jsonConfig) {
            var nNewTreeId = this.store.length;
            this.store.push(new Tree(jsonConfig, nNewTreeId));
            return this.get(nNewTreeId);
        },

        get: function (treeId) {
            return this.store[treeId];
        },

        destroy: function (treeId) {
            var tree = this.get(treeId);
            if (tree) {
                tree._R.remove();
                var draw_area = tree.drawArea;

                while (draw_area.firstChild) {
                    draw_area.removeChild(draw_area.firstChild);
                }

                var classes = draw_area.className.split(' '),
                    classes_to_stay = [];

                for (var i = 0; i < classes.length; i++) {
                    var cls = classes[i];
                    if (cls !== 'triton' && cls !== 'triton-loaded') {
                        classes_to_stay.push(cls);
                    }
                }
                draw_area.style.overflowY = '';
                draw_area.style.overflowX = '';
                draw_area.className = classes_to_stay.join(' ');

                this.store[treeId] = null;
            }
            return this;
        }
    };

    var Tree = function (jsonConfig, treeId) {
        this.reset = function (jsonConfig, treeId) {
            this.initJsonConfig = jsonConfig;
            this.initTreeId = treeId;

            this.id = treeId;

            var config = jsonConfig.config || {};
            this.CONFIG = UTIL.extend(Tree.CONFIG, config);
            this.drawArea = UTIL.findEl(this.CONFIG.container, true);
            if (!this.drawArea) {
                throw new Error('Failed to find element by selector "' + this.CONFIG.container + '"');
            }

            UTIL.addClass(this.drawArea, 'triton');

            this.drawArea.innerHTML = '';

            this.imageLoader = new ImageLoader();

            this.nodeDB = new NodeDB(jsonConfig.nodes, this);

            this.connectionStore = {};

            this.loaded = false;

            this._R = new Raphael(this.drawArea, 100, 100);

            return this;
        };

        this.reload = function () {
            this.reset(this.initJsonConfig, this.initTreeId).redraw();
            return this;
        };

        this.reset(jsonConfig, treeId);
    };

    Tree.prototype = {
        getNodeDb: function () {
            return this.nodeDB;
        },

        addNode: function (parentTreeNode, nodeDefinition) {
            this.CONFIG.callback.onBeforeAddNode.apply(this, [parentTreeNode, nodeDefinition]);

            var oNewNode = this.nodeDB.createNode(nodeDefinition, parentTreeNode.id, this);
            oNewNode.createGeometry(this);

            oNewNode.parent().createSwitchGeometry(this);

            this.positionTree();

            this.CONFIG.callback.onAfterAddNode.apply(this, [oNewNode, parentTreeNode, nodeDefinition]);

            return oNewNode;
        },

        redraw: function () {
            this.positionTree();
            return this;
        },

        positionTree: function (callback) {
            if (this.imageLoader.isNotLoading()) {
                var root = this.root();

                this.resetLevelData();

                this.firstWalk(root, 0);
                this.secondWalk(root, 0, 0, 0);

                this.positionNodes();

                if (this.CONFIG.animateOnInit) {
                    setTimeout(
                        () => {
                            root.toggleCollapse();
                        },
                        this.CONFIG.animateOnInitDelay
                    );
                }

                if (!this.loaded) {
                    UTIL.addClass(this.drawArea, 'triton-loaded');
                    if (Object.prototype.toString.call(callback) === "[object Function]") {
                        callback(this);
                    }
                    this.CONFIG.callback.onTreeLoaded.apply(this, [root]);
                    this.loaded = true;
                }
            }
            else {
                setTimeout(
                    () => {
                        this.positionTree(callback);
                    }, 10
                );
            }
            return this;
        },

        firstWalk: function (node, level) {
            node.prelim = null;
            node.modifier = null;

            this.setNeighbors(node, level);
            this.calcLevelDim(node, level);

            var leftSibling = node.leftSibling();

            if (node.childrenCount() === 0 || level == this.CONFIG.maxDepth) {
                if (leftSibling) {
                    node.prelim = leftSibling.prelim + leftSibling.size() + this.CONFIG.siblingSeparation;
                }
                else {
                    node.prelim = 0;
                }
            }
            else {
                for (var i = 0, n = node.childrenCount(); i < n; i++) {
                    this.firstWalk(node.childAt(i), level + 1);
                }

                var midPoint = node.childrenCenter() - node.size() / 2;

                if (leftSibling) {
                    node.prelim = leftSibling.prelim + leftSibling.size() + this.CONFIG.siblingSeparation;
                    node.modifier = node.prelim - midPoint;
                    this.apportion(node, level);
                }
                else {
                    node.prelim = midPoint;
                }

                if (node.stackParent) {
                    node.modifier += this.nodeDB.get(node.stackChildren[0]).size() / 2 + node.connStyle.stackIndent;
                }
                else if (node.stackParentId) {
                    node.prelim = 0;
                }
            }
            return this;
        },

        apportion: function (node, level) {
            var firstChild = node.firstChild(),
                firstChildLeftNeighbor = firstChild.leftNeighbor(),
                compareDepth = 1,
                depthToStop = this.CONFIG.maxDepth - level;

            while (firstChild && firstChildLeftNeighbor && compareDepth <= depthToStop) {
                var modifierSumRight = 0,
                    modifierSumLeft = 0,
                    leftAncestor = firstChildLeftNeighbor,
                    rightAncestor = firstChild;

                for (var i = 0; i < compareDepth; i++) {
                    leftAncestor = leftAncestor.parent();
                    rightAncestor = rightAncestor.parent();
                    modifierSumLeft += leftAncestor.modifier;
                    modifierSumRight += rightAncestor.modifier;

                    if (rightAncestor.stackParent !== undefined) {
                        modifierSumRight += rightAncestor.size() / 2;
                    }
                }

                var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft + firstChildLeftNeighbor.size() + this.CONFIG.subTeeSeparation) - (firstChild.prelim + modifierSumRight);

                if (totalGap > 0) {
                    var subtreeAux = node,
                        numSubtrees = 0;

                    while (subtreeAux && subtreeAux.id !== leftAncestor.id) {
                        subtreeAux = subtreeAux.leftSibling();
                        numSubtrees++;
                    }

                    if (subtreeAux) {
                        var subtreeMoveAux = node,
                            singleGap = totalGap / numSubtrees;

                        while (subtreeMoveAux.id !== leftAncestor.id) {
                            subtreeMoveAux.prelim += totalGap;
                            subtreeMoveAux.modifier += totalGap;

                            totalGap -= singleGap;
                            subtreeMoveAux = subtreeMoveAux.leftSibling();
                        }
                    }
                }

                compareDepth++;

                firstChild = (firstChild.childrenCount() === 0) ?
                    node.leftMost(0, compareDepth) :
                    firstChild = firstChild.firstChild();

                if (firstChild) {
                    firstChildLeftNeighbor = firstChild.leftNeighbor();
                }
            }
        },

        secondWalk: function (node, level, X, Y) {
            if (level > this.CONFIG.maxDepth) {
                return;
            }

            var xTmp = node.prelim + X,
                yTmp = Y, align = this.CONFIG.nodeAlign,
                orient = this.CONFIG.rootOrientation,
                levelHeight, nodesizeTmp;

            if (orient === 'NORTH' || orient === 'SOUTH') {
                levelHeight = this.levelMaxDim[level].height;
                nodesizeTmp = node.height;
                if (node.pseudo) {
                    node.height = levelHeight;
                }
            }
            else if (orient === 'WEST' || orient === 'EAST') {
                levelHeight = this.levelMaxDim[level].width;
                nodesizeTmp = node.width;
                if (node.pseudo) {
                    node.width = levelHeight;
                }
            }

            node.X = xTmp;

            if (node.pseudo) {
                if (orient === 'NORTH' || orient === 'WEST') {
                    node.Y = yTmp;
                }
                else if (orient === 'SOUTH' || orient === 'EAST') {
                    node.Y = (yTmp + (levelHeight - nodesizeTmp));
                }
            } else {
                node.Y = (align === 'CENTER') ? (yTmp + (levelHeight - nodesizeTmp) / 2) :
                    (align === 'TOP') ? (yTmp + (levelHeight - nodesizeTmp)) :
                        yTmp;
            }

            if (orient === 'WEST' || orient === 'EAST') {
                var swapTmp = node.X;
                node.X = node.Y;
                node.Y = swapTmp;
            }

            if (orient === 'SOUTH') {
                node.Y = -node.Y - nodesizeTmp;
            }
            else if (orient === 'EAST') {
                node.X = -node.X - nodesizeTmp;
            }

            if (node.childrenCount() !== 0) {
                if (node.id === 0 && this.CONFIG.hideRootNode) {
                    this.secondWalk(node.firstChild(), level + 1, X + node.modifier, Y);
                }
                else {
                    this.secondWalk(node.firstChild(), level + 1, X + node.modifier, Y + levelHeight + this.CONFIG.levelSeparation);
                }
            }

            if (node.rightSibling()) {
                this.secondWalk(node.rightSibling(), level, X, Y);
            }
        },

        positionNodes: function () {
            var treeSize = {
                x: this.nodeDB.getMinMaxCoord('X', null, null),
                y: this.nodeDB.getMinMaxCoord('Y', null, null)
            },

                treeWidth = treeSize.x.max - treeSize.x.min,
                treeHeight = treeSize.y.max - treeSize.y.min,

                treeCenter = {
                    x: treeSize.x.max - treeWidth / 2,
                    y: treeSize.y.max - treeHeight / 2
                };

            this.handleOverflow(treeWidth, treeHeight);

            var containerCenter = {
                x: this.drawArea.clientWidth / 2,
                y: this.drawArea.clientHeight / 2
            },

                deltaX = containerCenter.x - treeCenter.x,
                deltaY = containerCenter.y - treeCenter.y,
                i, len, node;

            // Clamp offsets so the tree never goes past CONFIG.padding on left/top
            deltaX = Math.max(this.CONFIG.padding - treeSize.x.min, deltaX);
            deltaY = Math.max(this.CONFIG.padding - treeSize.y.min, deltaY);

            for (i = 0, len = this.nodeDB.db.length; i < len; i++) {
                node = this.nodeDB.get(i);

                this.CONFIG.callback.onBeforePositionNode.apply(this, [node, i, containerCenter, treeCenter]);

                if (node.id === 0 && this.CONFIG.hideRootNode) {
                    this.CONFIG.callback.onAfterPositionNode.apply(this, [node, i, containerCenter, treeCenter]);
                    continue;
                }

                node.X += deltaX;
                node.Y += deltaY;

                var collapsedParent = node.collapsedParent(),
                    hidePoint = null;

                if (collapsedParent) {
                    hidePoint = collapsedParent.connectorPoint(true);
                    node.hide(hidePoint);
                }
                else if (node.positioned) {
                    node.show();
                }
                else {
                    node.nodeDOM.style.left = node.X + 'px';
                    node.nodeDOM.style.top = node.Y + 'px';
                    node.positioned = true;
                }

                if (node.id !== 0 && !(node.parent().id === 0 && this.CONFIG.hideRootNode)) {
                    this.setConnectionToParent(node, hidePoint);
                }
                else if (!this.CONFIG.hideRootNode && node.drawLineThrough) {
                    node.drawLineThroughMe();
                }

                // Draw extra parent connectors (converging edges)
                if (node.extraParentIds && node.extraParentIds.length) {
                    node.extraParentIds.forEach((extraParentId) => {
                        var extraParent = this.nodeDB.get(extraParentId);
                        if (extraParent && !extraParent.pseudo) {
                            var pathString = hidePoint
                                ? this.getPointPathString(hidePoint)
                                : this.getPathString(extraParent, node, false);

                            var connLine = this._R.path(pathString);
                            connLine.attr(extraParent.connStyle.style);
                            connLine.toBack();
                        }
                    });
                }

                this.CONFIG.callback.onAfterPositionNode.apply(this, [node, i, containerCenter, treeCenter]);
            }
            return this;
        },

        handleOverflow: function (treeWidth, treeHeight) {
            var viewWidth = (treeWidth < this.drawArea.clientWidth) ? this.drawArea.clientWidth : treeWidth + this.CONFIG.padding * 2,
                viewHeight = (treeHeight < this.drawArea.clientHeight) ? this.drawArea.clientHeight : treeHeight + this.CONFIG.padding * 2;

            this._R.setSize(viewWidth, viewHeight);

            if (this.CONFIG.scrollbar === 'resize') {
                UTIL.setDimensions(this.drawArea, viewWidth, viewHeight);
            }
            else if (!UTIL.isjQueryAvailable() || this.CONFIG.scrollbar === 'native') {
                if (this.drawArea.clientWidth < treeWidth) {
                    this.drawArea.style.overflowX = "auto";
                }
                if (this.drawArea.clientHeight < treeHeight) {
                    this.drawArea.style.overflowY = "auto";
                }
            }
            else if (this.CONFIG.scrollbar === 'fancy') {
                var jq_drawArea = $(this.drawArea);
                if (jq_drawArea.hasClass('ps-container')) {
                    jq_drawArea.find('.triton').css({
                        width: viewWidth,
                        height: viewHeight
                    });
                    jq_drawArea.perfectScrollbar('update');
                }
                else {
                    var mainContainer = jq_drawArea.wrapInner('<div class="triton"/>'),
                        child = mainContainer.find('.triton');

                    child.css({
                        width: viewWidth,
                        height: viewHeight
                    });

                    mainContainer.perfectScrollbar();
                }
            }
            return this;
        },

        setConnectionToParent: function (treeNode, hidePoint) {
            var stacked = treeNode.stackParentId,
                connLine,
                parent = (stacked ? this.nodeDB.get(stacked) : treeNode.parent()),

                pathString = hidePoint ?
                    this.getPointPathString(hidePoint) :
                    this.getPathString(parent, treeNode, stacked);

            if (this.connectionStore[treeNode.id]) {
                connLine = this.connectionStore[treeNode.id];
                this.animatePath(connLine, pathString);
            }
            else {
                connLine = this._R.path(pathString);
                this.connectionStore[treeNode.id] = connLine;

                if (treeNode.pseudo) {
                    delete parent.connStyle.style['arrow-end'];
                }
                if (parent.pseudo) {
                    delete parent.connStyle.style['arrow-start'];
                }

                connLine.attr(parent.connStyle.style);

                if (treeNode.drawLineThrough || treeNode.pseudo) {
                    treeNode.drawLineThroughMe(hidePoint);
                }
            }
            treeNode.connector = connLine;
            return this;
        },

        getPointPathString: (hidePoint) => ["_M", hidePoint.x, ",", hidePoint.y, 'L', hidePoint.x, ",", hidePoint.y, hidePoint.x, ",", hidePoint.y].join(' '),

        animatePath: function (path, pathString) {
            if (path.hidden && pathString.charAt(0) !== "_") {
                path.show();
                path.hidden = false;
            }

            path.animate(
                {
                    path: pathString.charAt(0) === "_" ?
                        pathString.substring(1) :
                        pathString
                },
                this.CONFIG.animation.connectorsSpeed,
                this.CONFIG.animation.connectorsAnimation,
                () => {
                    if (pathString.charAt(0) === "_") {
                        path.hide();
                        path.hidden = true;
                    }
                }
            );
            return this;
        },

        getPathString: function (from_node, to_node, stacked) {
            var startPoint = from_node.connectorPoint(true),
                endPoint = to_node.connectorPoint(false),
                orientation = this.CONFIG.rootOrientation,
                connType = from_node.connStyle.type,
                P1 = {}, P2 = {};

            if (orientation === 'NORTH' || orientation === 'SOUTH') {
                P1.y = P2.y = (startPoint.y + endPoint.y) / 2;
                P1.x = startPoint.x;
                P2.x = endPoint.x;
            }
            else if (orientation === 'EAST' || orientation === 'WEST') {
                P1.x = P2.x = (startPoint.x + endPoint.x) / 2;
                P1.y = startPoint.y;
                P2.y = endPoint.y;
            }

            var sp = startPoint.x + ',' + startPoint.y, p1 = P1.x + ',' + P1.y, p2 = P2.x + ',' + P2.y, ep = endPoint.x + ',' + endPoint.y,
                pm = (P1.x + P2.x) / 2 + ',' + (P1.y + P2.y) / 2, pathString, stackPoint;

            if (stacked) {
                stackPoint = (orientation === 'EAST' || orientation === 'WEST') ?
                    endPoint.x + ',' + startPoint.y :
                    startPoint.x + ',' + endPoint.y;

                if (connType === "step" || connType === "straight") {
                    pathString = ["M", sp, 'L', stackPoint, 'L', ep];
                }
                else if (connType === "curve" || connType === "bCurve") {
                    var helpPoint,
                        indent = from_node.connStyle.stackIndent;

                    if (orientation === 'NORTH') {
                        helpPoint = (endPoint.x - indent) + ',' + (endPoint.y - indent);
                    }
                    else if (orientation === 'SOUTH') {
                        helpPoint = (endPoint.x - indent) + ',' + (endPoint.y + indent);
                    }
                    else if (orientation === 'EAST') {
                        helpPoint = (endPoint.x + indent) + ',' + startPoint.y;
                    }
                    else if (orientation === 'WEST') {
                        helpPoint = (endPoint.x - indent) + ',' + startPoint.y;
                    }
                    pathString = ["M", sp, 'L', helpPoint, 'S', stackPoint, ep];
                }
            }
            else {
                if (connType === "step") {
                    pathString = ["M", sp, 'L', p1, 'L', p2, 'L', ep];
                }
                else if (connType === "curve") {
                    pathString = ["M", sp, 'C', p1, p2, ep];
                }
                else if (connType === "bCurve") {
                    pathString = ["M", sp, 'Q', p1, pm, 'T', ep];
                }
                else if (connType === "straight") {
                    pathString = ["M", sp, 'L', sp, ep];
                }
            }

            return pathString.join(" ");
        },

        setNeighbors: function (node, level) {
            node.leftNeighborId = this.lastNodeOnLevel[level];
            if (node.leftNeighborId) {
                node.leftNeighbor().rightNeighborId = node.id;
            }
            this.lastNodeOnLevel[level] = node.id;
            return this;
        },

        calcLevelDim: function (node, level) {
            this.levelMaxDim[level] = {
                width: Math.max(this.levelMaxDim[level] ? this.levelMaxDim[level].width : 0, node.width),
                height: Math.max(this.levelMaxDim[level] ? this.levelMaxDim[level].height : 0, node.height)
            };
            return this;
        },

        resetLevelData: function () {
            this.lastNodeOnLevel = [];
            this.levelMaxDim = [];
            return this;
        },

        root: function () {
            return this.nodeDB.get(0);
        }
    };

    var NodeDB = function (nodesConfig, tree) {
        this.reset(nodesConfig, tree);
    };

    NodeDB.prototype = {
        reset: function (nodesConfig, tree) {
            this.db = [];
            this.userIdMap = {};

            if (!nodesConfig || !Array.isArray(nodesConfig) || nodesConfig.length === 0) {
                return this;
            }

            // Identify root nodes (no parent or parent not in the config)
            var rootUserIds = [];
            var allUserIds = {};
            var hasParent = {};

            nodesConfig.forEach((nodeDef) => {
                var uid = String(nodeDef.id);
                allUserIds[uid] = true;
            });

            nodesConfig.forEach((nodeDef) => {
                var uid = String(nodeDef.id);
                var parent = nodeDef.parent;
                if (parent !== undefined && parent !== null) {
                    hasParent[uid] = true;
                    var parentIds = Array.isArray(parent) ? parent : [parent];
                    parentIds.forEach((pid) => {
                        var pidStr = String(pid);
                        if (!allUserIds[pidStr]) {
                            console.warn('triton: parent "' + pidStr + '" not found for node "' + uid + '"');
                        }
                    });
                }
            });

            nodesConfig.forEach((nodeDef) => {
                var uid = String(nodeDef.id);
                if (!hasParent[uid]) {
                    rootUserIds.push(nodeDef.id);
                }
            });

            // If multiple roots, create virtual hidden root
            if (rootUserIds.length > 1) {
                tree.CONFIG.hideRootNode = true;
                var virtualRootDef = {
                    id: null,
                    pseudo: true,
                    text: '',
                    _isVirtualRoot: true
                };
                var virtualId = this.db.length;
                var virtualNode = new TreeNode(virtualRootDef, virtualId, -1, tree, null);
                virtualNode.pseudo = true;
                virtualNode.width = 0;
                virtualNode.height = 0;
                this.db.push(virtualNode);
            }

            // First pass: create all user nodes
            nodesConfig.forEach((nodeDef) => {
                var uid = String(nodeDef.id);
                var internalId = this.db.length;
                this.userIdMap[uid] = internalId;

                var node = new TreeNode(nodeDef, internalId, -1, tree, null);
                this.db.push(node);
            });

            // Pass 2a: resolve parent relationships (must come before children)
            nodesConfig.forEach((nodeDef) => {
                var uid = String(nodeDef.id);
                var internalId = this.userIdMap[uid];
                var node = this.db[internalId];

                if (nodeDef.parent === undefined || nodeDef.parent === null) return;

                var parentIds = Array.isArray(nodeDef.parent) ? nodeDef.parent : [nodeDef.parent];
                parentIds.forEach((parentId, idx) => {
                    var parentUid = String(parentId);
                    var parentInternalId = this.userIdMap[parentUid];
                    if (parentInternalId === undefined) return;

                    if (idx === 0) {
                        node.parentId = parentInternalId;
                    } else {
                        node.extraParentIds.push(parentInternalId);
                    }
                });
            });

            // Pass 2b: resolve children (after parent — now we can check primary parent)
            nodesConfig.forEach((nodeDef) => {
                var uid = String(nodeDef.id);
                var internalId = this.userIdMap[uid];
                var node = this.db[internalId];

                if (nodeDef.children === undefined || nodeDef.children === null) return;

                var childIds = Array.isArray(nodeDef.children) ? nodeDef.children : [nodeDef.children];
                childIds.forEach((childId) => {
                    var childUid = String(childId);
                    var childInternalId = this.userIdMap[childUid];
                    if (childInternalId === undefined) return;

                    var childNode = this.db[childInternalId];
                    if (childNode.parentId === -1 || childNode.parentId === internalId) {
                        node.children.push(childInternalId);
                    }
                });
            });

            // Ensure children that have explicit parent are still in that parent's children list
            nodesConfig.forEach((nodeDef) => {
                if (!nodeDef.children) return;
                var parentUid = String(nodeDef.id);
                var parentInternalId = this.userIdMap[parentUid];
                if (parentInternalId === undefined) return;

                var childIds = Array.isArray(nodeDef.children) ? nodeDef.children : [nodeDef.children];
                childIds.forEach((childId) => {
                    var childUid = String(childId);
                    var childInternalId = this.userIdMap[childUid];
                    if (childInternalId === undefined) return;

                    var childNode = this.db[childInternalId];
                    // Only set parent if child doesn't have one yet
                    if (childNode.parentId === -1) {
                        childNode.parentId = parentInternalId;
                        // Also add to this parent's children if not already there
                        var parentNode = this.db[parentInternalId];
                        if (parentNode.children.indexOf(childInternalId) === -1) {
                            parentNode.children.push(childInternalId);
                        }
                    }
                });
            });

            // Detect implicit extra parents: parent lists child in children
            // but child's primary parent is someone else
            nodesConfig.forEach((nodeDef) => {
                if (!nodeDef.children) return;
                var parentUid = String(nodeDef.id);
                var parentInternalId = this.userIdMap[parentUid];
                if (parentInternalId === undefined) return;

                var childIds = Array.isArray(nodeDef.children) ? nodeDef.children : [nodeDef.children];
                childIds.forEach((childId) => {
                    var childUid = String(childId);
                    var childInternalId = this.userIdMap[childUid];
                    if (childInternalId === undefined) return;

                    var childNode = this.db[childInternalId];
                    if (childNode.parentId !== -1 && childNode.parentId !== parentInternalId) {
                        // This parent wants this child, but isn't the primary parent,
                        // so it's an extra parent connector
                        if (childNode.extraParentIds.indexOf(parentInternalId) === -1) {
                            childNode.extraParentIds.push(parentInternalId);
                        }
                    }
                });
            });

            // Handle virtual root: reparent all root nodes
            var virtualRootId = (rootUserIds.length > 1) ? 0 : -1;

            if (virtualRootId >= 0) {
                for (var i = 0; i < this.db.length; i++) {
                    var nd = this.db[i];
                    if (nd.id !== virtualRootId && nd.parentId === -1) {
                        nd.parentId = virtualRootId;
                        var vrNode = this.db[virtualRootId];
                        vrNode.children.push(nd.id);
                    }
                }
            }

            // Handle nodes with parent derived from children but also children list
            // Ensure consistency
            for (var j = 0; j < this.db.length; j++) {
                var n = this.db[j];
                if (n.parentId >= 0) {
                    var parentNode = this.db[n.parentId];
                    if (parentNode.children.indexOf(n.id) === -1) {
                        parentNode.children.push(n.id);
                    }
                }
            }

            // Clear children of nodes that don't have children of their own but pseudo-derived
            // Actually, leave as is

            this.createGeometries(tree);

            return this;
        },

        createGeometries: function (tree) {
            var i = this.db.length;
            while (i--) {
                this.get(i).createGeometry(tree);
            }
            return this;
        },

        get: function (nodeId) {
            return this.db[nodeId];
        },

        walk: function (callback) {
            var i = this.db.length;
            while (i--) {
                callback.apply(this, [this.get(i)]);
            }
            return this;
        },

        createNode: function (nodeStructure, parentId, tree, stackParentId) {
            var node = new TreeNode(nodeStructure, this.db.length, parentId, tree, stackParentId);
            this.db.push(node);

            if (parentId >= 0) {
                var parent = this.get(parentId);

                if (nodeStructure.position) {
                    if (nodeStructure.position === 'left') {
                        parent.children.push(node.id);
                    }
                    else if (nodeStructure.position === 'right') {
                        parent.children.splice(0, 0, node.id);
                    }
                    else if (nodeStructure.position === 'center') {
                        parent.children.splice(Math.floor(parent.children.length / 2), 0, node.id);
                    }
                    else {
                        var position = parseInt(nodeStructure.position);
                        if (parent.children.length === 1 && position > 0) {
                            parent.children.splice(0, 0, node.id);
                        }
                        else {
                            parent.children.splice(
                                Math.max(position, parent.children.length - 1),
                                0, node.id
                            );
                        }
                    }
                }
                else {
                    parent.children.push(node.id);
                }
            }

            if (stackParentId) {
                this.get(stackParentId).stackParent = true;
                this.get(stackParentId).stackChildren.push(node.id);
            }

            return node;
        },

        getMinMaxCoord: function (dim, parent, MinMax) {
            parent = parent || this.get(0);
            MinMax = MinMax || {
                min: parent[dim],
                max: parent[dim] + ((dim === 'X') ? parent.width : parent.height)
            };

            var i = parent.childrenCount();
            while (i--) {
                var node = parent.childAt(i),
                    maxTest = node[dim] + ((dim === 'X') ? node.width : node.height),
                    minTest = node[dim];

                if (maxTest > MinMax.max) {
                    MinMax.max = maxTest;
                }
                if (minTest < MinMax.min) {
                    MinMax.min = minTest;
                }

                this.getMinMaxCoord(dim, node, MinMax);
            }
            return MinMax;
        },

        hasGrandChildren: (nodeStructure) => {
            var i = nodeStructure.children.length;
            while (i--) {
                if (nodeStructure.children[i].children && nodeStructure.children[i].children.length > 0) {
                    return true;
                }
            }
            return false;
        }
    };

    var TreeNode = function (nodeStructure, id, parentId, tree, stackParentId) {
        this.reset(nodeStructure, id, parentId, tree, stackParentId);
    };

    TreeNode.prototype = {
        reset: function (nodeStructure, id, parentId, tree, stackParentId) {
            this.id = id;
            this.userId = nodeStructure.id || '__internal__';
            this.parentId = parentId;
            this.treeId = tree.id;

            this.prelim = 0;
            this.modifier = 0;
            this.leftNeighborId = null;

            this.stackParentId = stackParentId;

            this.pseudo = nodeStructure.pseudo || false;

            this.image = nodeStructure.image || null;

            this.link = nodeStructure.link || '';

            this.connStyle = UTIL.createMerge(tree.CONFIG.connectors, nodeStructure.connectors);
            this.connector = null;

            this.drawLineThrough = nodeStructure.drawLineThrough === false ? false : (nodeStructure.drawLineThrough || tree.CONFIG.node.drawLineThrough);

            this.collapsable = nodeStructure.collapsable === false ? false : (nodeStructure.collapsable || tree.CONFIG.node.collapsable);
            this.collapsed = nodeStructure.collapsed;

            this.text = nodeStructure.text || '';

            this.nodeInnerHTML = nodeStructure.innerHTML;
            this.nodeHTMLclass = (tree.CONFIG.node.HTMLclass ? tree.CONFIG.node.HTMLclass : '') +
                (nodeStructure.HTMLclass ? (' ' + nodeStructure.HTMLclass) : '');

            this.nodeHTMLid = nodeStructure.HTMLid;

            this.children = [];

            this.extraParentIds = [];

            return this;
        },

        getTree: function () {
            return TreeStore.get(this.treeId);
        },

        getTreeConfig: function () {
            return this.getTree().CONFIG;
        },

        getTreeNodeDb: function () {
            return this.getTree().getNodeDb();
        },

        lookupNode: function (nodeId) {
            return this.getTreeNodeDb().get(nodeId);
        },

        Tree: function () {
            return TreeStore.get(this.treeId);
        },

        dbGet: function (nodeId) {
            return this.getTreeNodeDb().get(nodeId);
        },

        size: function () {
            var orientation = this.getTreeConfig().rootOrientation;

            if (this.pseudo) {
                return (-this.getTreeConfig().subTeeSeparation);
            }

            if (orientation === 'NORTH' || orientation === 'SOUTH') {
                return this.width;
            }
            else if (orientation === 'WEST' || orientation === 'EAST') {
                return this.height;
            }
        },

        childrenCount: function () {
            return ((this.collapsed || !this.children) ? 0 : this.children.length);
        },

        childAt: function (index) {
            return this.dbGet(this.children[index]);
        },

        firstChild: function () {
            return this.childAt(0);
        },

        lastChild: function () {
            return this.childAt(this.children.length - 1);
        },

        parent: function () {
            return this.lookupNode(this.parentId);
        },

        leftNeighbor: function () {
            if (this.leftNeighborId) {
                return this.lookupNode(this.leftNeighborId);
            }
        },

        rightNeighbor: function () {
            if (this.rightNeighborId) {
                return this.lookupNode(this.rightNeighborId);
            }
        },

        leftSibling: function () {
            var leftNeighbor = this.leftNeighbor();
            if (leftNeighbor && leftNeighbor.parentId === this.parentId) {
                return leftNeighbor;
            }
        },

        rightSibling: function () {
            var rightNeighbor = this.rightNeighbor();
            if (rightNeighbor && rightNeighbor.parentId === this.parentId) {
                return rightNeighbor;
            }
        },

        childrenCenter: function () {
            var first = this.firstChild(),
                last = this.lastChild();
            return (first.prelim + ((last.prelim - first.prelim) + last.size()) / 2);
        },

        collapsedParent: function () {
            var parent = this.parent();
            if (!parent) {
                return false;
            }
            if (parent.collapsed) {
                return parent;
            }
            return parent.collapsedParent();
        },

        leftMost: function (level, depth) {
            if (level >= depth) {
                return this;
            }
            if (this.childrenCount() === 0) {
                return;
            }

            for (var i = 0, n = this.childrenCount(); i < n; i++) {
                var leftmostDescendant = this.childAt(i).leftMost(level + 1, depth);
                if (leftmostDescendant) {
                    return leftmostDescendant;
                }
            }
        },

        connectorPoint: function (startPoint) {
            var orient = this.Tree().CONFIG.rootOrientation, point = {};

            if (this.stackParentId) {
                if (orient === 'NORTH' || orient === 'SOUTH') {
                    orient = 'WEST';
                }
                else if (orient === 'EAST' || orient === 'WEST') {
                    orient = 'NORTH';
                }
            }

            if (orient === 'NORTH') {
                point.x = (this.pseudo) ? this.X - this.Tree().CONFIG.subTeeSeparation / 2 : this.X + this.width / 2;
                point.y = (startPoint) ? this.Y + this.height : this.Y;
            }
            else if (orient === 'SOUTH') {
                point.x = (this.pseudo) ? this.X - this.Tree().CONFIG.subTeeSeparation / 2 : this.X + this.width / 2;
                point.y = (startPoint) ? this.Y : this.Y + this.height;
            }
            else if (orient === 'EAST') {
                point.x = (startPoint) ? this.X : this.X + this.width;
                point.y = (this.pseudo) ? this.Y - this.Tree().CONFIG.subTeeSeparation / 2 : this.Y + this.height / 2;
            }
            else if (orient === 'WEST') {
                point.x = (startPoint) ? this.X + this.width : this.X;
                point.y = (this.pseudo) ? this.Y - this.Tree().CONFIG.subTeeSeparation / 2 : this.Y + this.height / 2;
            }
            return point;
        },

        pathStringThrough: function () {
            var startPoint = this.connectorPoint(true),
                endPoint = this.connectorPoint(false);
            return ["M", startPoint.x + "," + startPoint.y, 'L', endPoint.x + "," + endPoint.y].join(" ");
        },

        drawLineThroughMe: function (hidePoint) {
            var pathString = hidePoint ?
                this.Tree().getPointPathString(hidePoint) :
                this.pathStringThrough();

            this.lineThroughMe = this.lineThroughMe || this.Tree()._R.path(pathString);

            var line_style = UTIL.cloneObj(this.connStyle.style);

            delete line_style['arrow-start'];
            delete line_style['arrow-end'];

            this.lineThroughMe.attr(line_style);

            if (hidePoint) {
                this.lineThroughMe.hide();
                this.lineThroughMe.hidden = true;
            }
        },

        addSwitchEvent: function (nodeSwitch) {
            UTIL.addEvent(nodeSwitch, 'click',
                (e) => {
                    e.preventDefault();
                    if (this.getTreeConfig().callback.onBeforeClickCollapseSwitch.apply(this, [nodeSwitch, e]) === false) {
                        return false;
                    }

                    this.toggleCollapse();

                    this.getTreeConfig().callback.onAfterClickCollapseSwitch.apply(this, [nodeSwitch, e]);
                }
            );
        },

        collapse: function () {
            if (!this.collapsed) {
                this.toggleCollapse();
            }
            return this;
        },

        expand: function () {
            if (this.collapsed) {
                this.toggleCollapse();
            }
            return this;
        },

        toggleCollapse: function () {
            var oTree = this.getTree();

            if (!oTree.inAnimation) {
                oTree.inAnimation = true;

                this.collapsed = !this.collapsed;
                UTIL.toggleClass(this.nodeDOM, 'collapsed', this.collapsed);

                oTree.positionTree();

                setTimeout(
                    () => {
                        oTree.inAnimation = false;
                        oTree.CONFIG.callback.onToggleCollapseFinished.apply(oTree, [this, this.collapsed]);
                    },
                    (oTree.CONFIG.animation.nodeSpeed > oTree.CONFIG.animation.connectorsSpeed) ?
                        oTree.CONFIG.animation.nodeSpeed :
                        oTree.CONFIG.animation.connectorsSpeed
                );
            }
            return this;
        },

        hide: function (collapse_to_point) {
            collapse_to_point = collapse_to_point || false;

            var bCurrentState = this.hidden;
            this.hidden = true;

            this.nodeDOM.style.overflow = 'hidden';

            var tree = this.getTree(),
                config = this.getTreeConfig(),
                oNewState = {
                    opacity: 0
                };

            if (collapse_to_point) {
                oNewState.left = collapse_to_point.x;
                oNewState.top = collapse_to_point.y;
            }

            if (!this.positioned || bCurrentState) {
                this.nodeDOM.style.visibility = 'hidden';
                if ($) {
                    $(this.nodeDOM).css(oNewState);
                }
                else {
                    this.nodeDOM.style.left = oNewState.left + 'px';
                    this.nodeDOM.style.top = oNewState.top + 'px';
                }
                this.positioned = true;
            }
            else {
                if ($) {
                    $(this.nodeDOM).animate(
                        oNewState, config.animation.nodeSpeed, config.animation.nodeAnimation,
                        function () {
                            this.style.visibility = 'hidden';
                        }
                    );
                }
                else {
                    this.nodeDOM.style.transition = 'all ' + config.animation.nodeSpeed + 'ms ease';
                    this.nodeDOM.style.transitionProperty = 'opacity, left, top';
                    this.nodeDOM.style.opacity = oNewState.opacity;
                    this.nodeDOM.style.left = oNewState.left + 'px';
                    this.nodeDOM.style.top = oNewState.top + 'px';
                    this.nodeDOM.style.visibility = 'hidden';
                }
            }

            if (this.lineThroughMe) {
                var new_path = tree.getPointPathString(collapse_to_point);
                if (bCurrentState) {
                    this.lineThroughMe.attr({ path: new_path });
                }
                else {
                    tree.animatePath(this.lineThroughMe, tree.getPointPathString(collapse_to_point));
                }
            }

            return this;
        },

        hideConnector: function () {
            var oTree = this.Tree();
            var oPath = oTree.connectionStore[this.id];
            if (oPath) {
                oPath.animate(
                    { 'opacity': 0 },
                    oTree.CONFIG.animation.connectorsSpeed,
                    oTree.CONFIG.animation.connectorsAnimation
                );
            }
            return this;
        },

        show: function () {
            this.hidden = false;

            this.nodeDOM.style.visibility = 'visible';

            var oTree = this.Tree();

            var oNewState = {
                left: this.X,
                top: this.Y,
                opacity: 1
            },
                config = this.getTreeConfig();

            if ($) {
                $(this.nodeDOM).animate(
                    oNewState,
                    config.animation.nodeSpeed, config.animation.nodeAnimation,
                    function () {
                        this.style.overflow = "";
                    }
                );
            }
            else {
                this.nodeDOM.style.transition = 'all ' + config.animation.nodeSpeed + 'ms ease';
                this.nodeDOM.style.transitionProperty = 'opacity, left, top';
                this.nodeDOM.style.left = oNewState.left + 'px';
                this.nodeDOM.style.top = oNewState.top + 'px';
                this.nodeDOM.style.opacity = oNewState.opacity;
                this.nodeDOM.style.overflow = '';
            }

            if (this.lineThroughMe) {
                this.getTree().animatePath(this.lineThroughMe, this.pathStringThrough());
            }

            return this;
        },

        showConnector: function () {
            var oTree = this.Tree();
            var oPath = oTree.connectionStore[this.id];
            if (oPath) {
                oPath.animate(
                    { 'opacity': 1 },
                    oTree.CONFIG.animation.connectorsSpeed,
                    oTree.CONFIG.animation.connectorsAnimation
                );
            }
            return this;
        }
    };

    TreeNode.prototype.buildNodeFromText = function (node) {
        if (this.image) {
            image = document.createElement('img');
            image.src = this.image;
            node.appendChild(image);
        }

        if (this.text) {
            var textElement = document.createElement('p');
            textElement.className = "node-text";
            textElement.appendChild(document.createTextNode(this.text));
            node.appendChild(textElement);
        }

        return node;
    };

    TreeNode.prototype.buildNodeFromHtml = function (node) {
        if (this.nodeInnerHTML.charAt(0) === "#") {
            var elem = document.getElementById(this.nodeInnerHTML.substring(1));
            if (elem) {
                node = elem.cloneNode(true);
                node.id += "-clone";
                node.className += " node";
            }
            else {
                node.innerHTML = "<b> Wrong ID selector </b>";
            }
        }
        else {
            node.innerHTML = this.nodeInnerHTML;
        }
        return node;
    };

    TreeNode.prototype.createGeometry = function (tree) {
        if (this.id === 0 && tree.CONFIG.hideRootNode) {
            this.width = 0;
            this.height = 0;
            return;
        }

        var drawArea = tree.drawArea,
            image,

            node = document.createElement(this.link ? 'a' : 'div');

        node.className = (!this.pseudo) ? TreeNode.CONFIG.nodeHTMLclass : 'pseudo';
        if (this.nodeHTMLclass && !this.pseudo) {
            node.className += ' ' + this.nodeHTMLclass;
        }

        if (this.nodeHTMLid) {
            node.id = this.nodeHTMLid;
        }

        if (this.link) {
            node.href = this.link;
            node.target = tree.CONFIG.node.link.target;
        }

        if ($) {
            $(node).data('treenode', this);
        }
        else {
            node.data = {
                'treenode': this
            };
        }

        if (!this.pseudo) {
            node = this.nodeInnerHTML ? this.buildNodeFromHtml(node) : this.buildNodeFromText(node);

            if (this.collapsed || (this.collapsable && this.childrenCount() && !this.stackParentId)) {
                this.createSwitchGeometry(tree, node);
            }
        }

        tree.CONFIG.callback.onCreateNode.apply(tree, [this, node]);

        drawArea.appendChild(node);

        this.width = node.offsetWidth;
        this.height = node.offsetHeight;

        this.nodeDOM = node;

        tree.imageLoader.processNode(this);
    };

    TreeNode.prototype.createSwitchGeometry = function (tree, nodeEl) {
        nodeEl = nodeEl || this.nodeDOM;

        var nodeSwitchEl = UTIL.findEl('.collapse-switch', true, nodeEl);
        if (!nodeSwitchEl) {
            nodeSwitchEl = document.createElement('a');
            nodeSwitchEl.className = "collapse-switch";

            nodeEl.appendChild(nodeSwitchEl);
            this.addSwitchEvent(nodeSwitchEl);
            if (this.collapsed) {
                nodeEl.className += " collapsed";
            }

            tree.CONFIG.callback.onCreateNodeCollapseSwitch.apply(tree, [this, nodeEl, nodeSwitchEl]);
        }
        return nodeSwitchEl;
    };

    Tree.CONFIG = {
        maxDepth: 100,
        rootOrientation: 'NORTH',
        nodeAlign: 'CENTER',
        levelSeparation: 30,
        siblingSeparation: 30,
        subTeeSeparation: 30,

        hideRootNode: false,

        animateOnInit: false,
        animateOnInitDelay: 500,

        padding: 15,
        scrollbar: 'native',

        connectors: {
            type: 'curve',
            style: {
                stroke: 'black'
            },
            stackIndent: 15
        },

        node: {
            HTMLclass: 'node',
            drawLineThrough: false,
            collapsable: false,
            link: {
                target: '_self'
            }
        },

        animation: {
            nodeSpeed: 450,
            nodeAnimation: 'linear',
            connectorsSpeed: 450,
            connectorsAnimation: 'linear'
        },

        callback: {
            onCreateNode: (treeNode, treeNodeDom) => { },
            onCreateNodeCollapseSwitch: (treeNode, treeNodeDom, switchDom) => { },
            onAfterAddNode: (newTreeNode, parentTreeNode, nodeStructure) => { },
            onBeforeAddNode: (parentTreeNode, nodeStructure) => { },
            onAfterPositionNode: (treeNode, nodeDbIndex, containerCenter, treeCenter) => { },
            onBeforePositionNode: (treeNode, nodeDbIndex, containerCenter, treeCenter) => { },
            onToggleCollapseFinished: (treeNode, bIsCollapsed) => { },
            onAfterClickCollapseSwitch: (nodeSwitch, event) => { },
            onBeforeClickCollapseSwitch: (nodeSwitch, event) => { },
            onTreeLoaded: (rootTreeNode) => { }
        }
    };

    TreeNode.CONFIG = {
        nodeHTMLclass: 'node'
    };

    var triton = function (jsonConfig, callback, jQuery) {
        // Extract the nodes array
        var nodesArray = jsonConfig.nodes || [];

        // Build internal config: everything except nodes
        var config = {};

        // Copy all properties from jsonConfig except 'nodes'
        for (var key in jsonConfig) {
            if (Object.hasOwn(jsonConfig, key) && key !== 'nodes') {
                config[key] = jsonConfig[key];
            }
        }

        // Handle container default
        if (!config.container) {
            config.container = '#graph';
        }

        // Handle target
        if (config.target) {
            config.node = config.node || {};
            config.node.link = config.node.link || {};
            config.node.link.target = config.target;
            delete config.target;
        }

        if (jQuery) {
            $ = jQuery;
        }

        var treeConfig = {
            config: config,
            nodes: nodesArray
        };

        this.tree = TreeStore.createTree(treeConfig);
        this.tree.positionTree(callback);
    };

    triton.prototype.destroy = function () {
        TreeStore.destroy(this.tree.id);
    };

    window.triton = triton;

})();
