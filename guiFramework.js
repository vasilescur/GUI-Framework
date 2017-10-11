var canvas;
var context;
var panes = [];

var newPaneZIndex = 1;

var GUIfont = '14px Verdana';
var titleBarHeight = 22;

class GUIElement {
    constructor(posX, posY, width, height, backgroundColor) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
    }

    draw() {}
}

class Pane extends GUIElement {
    constructor(title, posX, posY, width, height, backgroundColor) {
        super(posX, posY, width, height, backgroundColor);
        this.title = title;

        this.controls = [];

        this.zIndex = newPaneZIndex;
        newPaneZIndex++;
        this.beingDragged = false;
        
        panes.forEach(p => p.zIndex++);
        this.zIndex = 1;
    }

    draw() {
        context.fillStyle = this.backgroundColor;
        context.fillRect(this.posX, this.posY, this.width, this.height);

        // Draw title bar
        context.fillStyle = 'rgb(200, 230, 255)';
        context.fillRect(this.posX, this.posY, this.width, titleBarHeight);

        // Title
        context.fillStyle = 'black';
        context.fillText(this.title, this.posX - 35 + this.width / 2, this.posY + 15);

        // Outline
        context.beginPath();
        context.moveTo(this.posX, this.posY);
        context.lineTo(this.posX + this.width, this.posY);
        context.lineTo(this.posX + this.width, this.posY + this.height);
        context.lineTo(this.posX, this.posY + this.height);
        context.lineTo(this.posX, this.posY);
        context.strokeStyle = 'blue';
        context.stroke();

        // Draw controls
        this.controls.forEach(function(control) {
            control.draw();
        }, this);
    }

    add(control) {
        control.controlOffsetX = control.posX - this.posX;
        control.controlOffsetY = control.posY - this.posY;
        this.controls.push(control);
    }

    handleClick(event) {
        this.controls.forEach(function(control) {
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;

            if ((y > control.posY && y < (control.posY + control.height)) && (x > control.posX && x < (control.posX + control.width))) {
                control.handleClick();
            }
        }, this);
    }

    handleTitleMouseDown(event) {
        this.mouseStartOffX = event.pageX - canvas.offsetLeft - this.posX;
        this.mouseStartOffY = event.pageY - canvas.offsetTop - this.posY;
        this.beingDragged = true;
    }

    handleTitleMouseUp(event) {
        this.beingDragged = false;
    }

    handleTitleMouseMove(event) {
        this.posX = event.pageX - canvas.offsetLeft - this.mouseStartOffX;
        this.posY = event.pageY - canvas.offsetTop - this.mouseStartOffY;

        this.controls.forEach(function(control) {
            control.posX = event.pageX - canvas.offsetLeft - this.mouseStartOffX + control.controlOffsetX;
            control.posY = event.pageY - canvas.offsetTop - this.mouseStartOffY + control.controlOffsetY;
        }, this);

        reDraw();
    }
}

class Control extends GUIElement {
    constructor(posX, posY, width, height, backgroundColor) {
        super(posX, posY, width, height, backgroundColor);
        this.controlOffsetX = 0;
        this.controlOffsetY = 0;
    }    
}

class Button extends Control {
    constructor(text, posX, posY, backgroundColor, onClick) {
        super(posX, posY, getTextWidth(text, GUIfont) + 10, 22, backgroundColor);
        this.text = text;
        this.onClick = onClick;
    }

    draw() {
        context.fillStyle = this.backgroundColor;
        context.fillRect(this.posX, this.posY, this.width, this.height);

        // Outline
        context.beginPath();
        context.moveTo(this.posX, this.posY);
        context.lineTo(this.posX + this.width, this.posY);
        context.lineTo(this.posX + this.width, this.posY + this.height);
        context.lineTo(this.posX, this.posY + this.height);
        context.lineTo(this.posX, this.posY);
        context.strokeStyle = 'black';
        context.lineWidth = 0.5;
        context.stroke();

        context.font = GUIfont;
        context.fillStyle = 'black';
        context.fillText(this.text, this.posX + 5, this.posY + 15);
    }

    handleClick() {
        this.onClick.call(this);
    }
}

class Label extends Control {
    constructor(text, color, posX, posY, backgroundColor) {
        super(posX, posY, getTextWidth(text, GUIfont) + 10, 22, backgroundColor);
        this.text = text;
        this.color = color;
    }

    draw() {
        context.fillStyle = this.backgroundColor;
        context.fillRect(this.posX, this.posY, this.width, this.height);

        context.fillStyle = 'rgb(0, 0, 0)';
        context.fillText(this.text, this.xPos, this.yPos);
    }
}

function init() {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    // For click handling
    canvas.addEventListener('click', function(event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;

        sortPanes();

        panes.some(function(pane) {
            if ((y > pane.posY && y < (pane.posY + titleBarHeight)) && (x > pane.posX && x < (pane.posX + pane.width))) {
                if (pane === panes[0]) {
                    pane.zIndex = 0;
                    panes.forEach(p => p.zIndex++);
                    sortPanes();
                    reDraw();
                }
            }
        });

        panes.some(function(pane) {
            if ((y > pane.posY && y < (pane.posY + pane.height)) && (x > pane.posX && x < (pane.posX + pane.width))) {
                if (pane.zIndex == 1) {
                    pane.handleClick(event);
                }
            }
        }, this);
    });

    // For pane dragging
    canvas.addEventListener('mousedown', function(event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;

        sortPanes();

        panes.some(function(pane) {
            var topPane = panes[0];

            if (!(((y > topPane.posY && y < (topPane.posY + topPane.height)) && (x > topPane.posX && x < (topPane.posX + topPane.width))))) {
                if ((y > pane.posY && y < (pane.posY + pane.height)) && (x > pane.posX && x < (pane.posX + pane.width))) {
                    if (pane.zIndex != 1) {
                        pane.zIndex = 0;
                        panes.forEach(p => p.zIndex++);
                        sortPanes();
                        reDraw();
                    }
                }
            }
        }, this);

        panes.some(function(pane) {
            if ((y > pane.posY && y < (pane.posY + titleBarHeight)) && (x > pane.posX && x < (pane.posX + pane.width))) {
                if (pane === panes[0]) {
                    pane.zIndex = 0;
                    panes.forEach(p => p.zIndex++);
                    sortPanes();
                    reDraw();
                }

                if (pane.zIndex == 1) {
                    pane.handleTitleMouseDown(event);
                }
            }
        }, this);
    });

    canvas.addEventListener('mouseup', function(event) {
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;

        sortPanes();

        panes.some(function(pane) {
            if ((y > pane.posY && y < (pane.posY + titleBarHeight)) && (x > pane.posX && x < (pane.posX + pane.width))) {
                if (pane.zIndex == 1) {
                    pane.handleTitleMouseUp(event);
                }
            }
        }, this);
    });

    canvas.addEventListener('mousemove', function(event) {
        sortPanes();

        panes.some(function(pane) {
            if (pane.beingDragged) {
                pane.handleTitleMouseMove(event);
            }
        });
    });
}

function reDraw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    panes.sort(function(a, b) {
        return a.zIndex < b.zIndex;
    });

    panes.forEach(function(p) {
        p.draw();
    }, this);
}

function sortPanes() {
    panes.sort(function(a, b) {
        if (a.zIndex < b.zIndex) {
            return -1;
        }
        if (a.zIndex > b.zIndex) { 
            return 1;
        }
        return 0;
    });
}

function getTextWidth(text, font) {
    context.font = font;
    return context.measureText(text).width;
}


function test() {
    init();

    var pane = new Pane("Test Pane", 20, 20, 250, 180, 'rgb(200, 200, 200)');
    var testButton = new Button("Click me!", 100, 60, 'white', function() { alert("Hello!"); });
    pane.add(testButton);

    pane.add(new Button("No, me!", 60, 90, 'rgb(220, 255, 255)', function() { alert('Thanks!'); }));

    pane.add(new Button("Open second Pane", 60, 140, 'rgb(255, 210, 255)', function() {
        var secondPane = new Pane("Second Pane", 80, 130, 250, 150, 'rgb(230, 230, 230)');
        secondPane.add(new Button("I am another Button", 110, 160, 'rgb(230, 255, 230)', function() {
            alert('Hello from pane 2!');
        }));
        secondPane.add(new Button("Close second Pane", 95, 240, 'rgb(255, 210, 210)', function() {
            panes.splice(panes.indexOf(secondPane), 1);
            reDraw();
        }));
        secondPane.add(new Label("Hello, world!", 'rgb(0, 0, 0)', 95, 210, secondPane.backgroundColor));
        panes.push(secondPane);
        reDraw();
    }));

    panes.push(pane);

    reDraw();
}

