class Path {
    constructor(container) {
        this.path = []
        this.closed = false;
        this.path_str = ""
        this.init_pos = { x: 0, y: 0 }
        this.clicked = false;
        this.selected_point = null;
        this.context = 'path'
        this.points = []
        this.container = (container && container.innerHTML) ? container : document.querySelector('#' + container);
        this.clipped_box = this.container.querySelector(".clipped-box");
        this.footer = document.querySelector("footer");
        this.code_snippet = document.querySelector(".code-snippet");
        this.copy_btn = document.querySelector("copy-code");
        this.anim_btn = document.querySelector("anim-btn")
        this.header = document.querySelector(".header");
    }

    init = (e) => {
        if (!this.container) {
            return console.error("container not found!");
        }
        this.container.addEventListener('mousedown', (e) => {
            this.getContext(e)
        })
        this.container.addEventListener('mouseup', (e) => {
            this.clicked = false;
            this.selected_point = null;
            this.container.classList.remove('dragging')
        })
        this.container.addEventListener('mousemove', (e) => {
            this.movePoint(e)
        })
        this.container.addEventListener('mouseover', (e) => {
            if (e.target.nodeName === "POINT") {
                if (e.target.getAttribute("point-index") == "0") {
                    this.container.classList.add("path-closing");
                }
            } else {
                this.container.classList.remove("path-closing");
            }
        })
        this.footer.addEventListener('click', (e) => {
            if(e.target.nodeName === 'COPY-CODE' || e.target.nodeName === 'CODE') {
                this.copyToClipboard(this.path_str)
            }
            if(e.target.nodeName === 'ANIM-BTN') {
                e.target.innerHTML = 'Coming Soon...'
                setTimeout(x=>{
                    e.target.innerHTML = 'Animate Path'
                },1500)
            }
        })
        setInterval(x => {
            this.code_snippet.innerHTML = this.path_str
        }, 1)
    }

    getContext = (e) => {
        if (e.target.nodeName == 'LINE' && this.closed) {
            let index = parseInt(e.target.getAttribute("line-index"));
            this.startPath(e, index)
            return;
        }

        if (e.target.nodeName == 'POINT') {
            this.clicked = true;
            this.container.classList.add('dragging')
            this.selected_point = {
                element: e.target,
                x: e.clientX,
                y: e.clientY
            }

            if (e.target.getAttribute("point-index") == '0') {
                if (this.path.length > 2) {
                    this.closed = true;
                    this.container.classList.add("path-closed");
                    this.header.setAttribute("hint", "path is closed")
                    this.header.setAttribute("hint-desc", "touch shape border to add points")
                    this.genPoints();
                }
            }
            return;
        }

        if (this.context == 'path' && !this.closed) {
            this.header.setAttribute("hint", "path is not closed");
            this.header.setAttribute("hint-desc", "touch green dot to close path")
            this.startPath(e);
        }
    }

    startPath = (e, index = 0) => {
        index = index || this.path.length;
        let per = this.getCoords(e)
        this.insertAtIndex({ x: per.x, y: per.y, ax: per.ax, ay: per.ay }, index)
        this.genPoints()
        this.clipPath()
    }

    movePoint = (e) => {
        if (!this.clicked) return;
        let per = this.getCoords(e);
        let index_ = this.selected_point.element.getAttribute("point-index");
        this.path[index_] = {
            x: per.x,
            y: per.y,
            ax: per.ax,
            ay: per.ay
        }
        this.genPoints();
        this.clipPath();
    }

    getCoords = (e) => {
        let p = {
            x: e.clientX - this.container.getBoundingClientRect().x,
            y: e.clientY - this.container.getBoundingClientRect().y,
        }
        return {
            x: p.x / this.container.clientWidth * 100,
            y: p.y / this.container.clientHeight * 100,
            ax: p.x,
            ay: p.y
        }
    }

    insertAtIndex = (obj, index) => {
        let temp = []
        let new_length = this.path.length + 1;
        let left_ = this.path.slice(0, index);
        temp.push(...left_)
        temp.push(obj)
        console.log(obj)
        for (let i = index + 1; i < new_length; i++) {
            temp.push(this.path[i - 1])
        }
        this.path = temp;
    }

    genPoints = () => {
        let points_ = this.container.querySelectorAll("point");
        let lines_ = this.container.querySelectorAll("line");

        points_.forEach(x => x.remove())
        lines_.forEach(x => x.remove())

        let prev = null;
        this.path.forEach((x, i) => {
            let p = document.createElement('point');
            let style_ = "left:" + x.x + "%;top:" + x.y + "%;";
            p.setAttribute("style", style_);
            p.setAttribute("path-x", x.x);
            p.setAttribute("path-y", x.y);
            p.setAttribute("point-index", i)
            this.container.appendChild(p)

            if (prev) {
                let line = document.createElement('line');
                let w_ = this.calcDistance(prev.ax, prev.ay, x.ax, x.ay)
                let angle_ = this.calcAngle(prev.ax, prev.ay, x.ax, x.ay)
                style_ = "left:" + prev.ax + "px;top:" + prev.ay + "px;width:" + w_ + "px;transform:rotate(" + angle_ + "deg) translate(0, -50%)";
                line.setAttribute("style", style_)
                line.setAttribute("line-index", i)
                this.container.appendChild(line)
            }
            prev = x;
        })

        if (this.closed) {
            let last_ = this.path[this.path.length - 1];
            let first_ = this.path[0];

            let line = document.createElement('line');
            let w_ = this.calcDistance(first_.ax, first_.ay, last_.ax, last_.ay)
            let angle_ = this.calcAngle(first_.ax, first_.ay, last_.ax, last_.ay)
            let style_ = "left:" + first_.ax + "px;top:" + first_.ay + "px;width:" + w_ + "px;transform:rotate(" + angle_ + "deg) translate(0, -50%)";
            line.setAttribute("style", style_)
            line.setAttribute("line-index", this.path.length)
            this.container.appendChild(line)
        }
    }

    clipPath() {
        this.path_str = "clip-path: polygon("
        this.path.forEach((x, i) => {
            let last = !(i < (this.path.length - 1));
            this.path_str += (x.x + "% " + x.y + "%" + (last ? '' : ',')) + (last ? ')' : '')
        })
        this.clipped_box.setAttribute('style', this.path_str)
    }

    copyToClipboard = (txt) => {
        let el = document.createElement('input');
        el.value = txt
        el.click();
        el.select();
        navigator.clipboard.writeText(el.value);
        this.copy_btn.innerHTML = "Copied!"
        setTimeout(x => {
            this.copy_btn.innerHTML = "Copy Code"
            el.remove();
        }, 1500)
    }

    calcDistance(x1, y1, x2, y2) {
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        return distance;
    }

    calcAngle(x1, y1, x2, y2) {
        const angleRadians = Math.atan2(y2 - y1, x2 - x1);
        const angleDegrees = (angleRadians * 180) / Math.PI;
        return angleDegrees;
    }
}