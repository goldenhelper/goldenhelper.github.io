class BezierCurve {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.color = config.color;
        this.offset = config.offset;
        this.direction = config.direction;
        this.speed = config.speed || 1;
        this.time = config.offset * 1000;
        this.width = canvas.width;
        this.height = canvas.height;
        this.opacity = 0;
        this.fadeIn = true;
        this.fadeOut = false;
        this.lifespan = config.lifespan || (Math.random() * 500 + 300); // Random lifespan between 3-8 seconds
        this.age = 0;
        this.points = [];
        this.init();
    }

    init() {
        const randomOffset = Math.random() * 200 - 100;
        if (this.direction === 'horizontal') {
            this.points = [
                { x: -100, y: this.height / 2 + this.offset + randomOffset },
                { x: this.width / 3, y: this.height / 3 + this.offset + randomOffset },
                { x: (2 * this.width) / 3, y: (2 * this.height) / 3 + this.offset + randomOffset },
                { x: this.width + 100, y: this.height / 2 + this.offset + randomOffset }
            ];
        } else {
            this.points = [
                { x: this.width / 2 + this.offset + randomOffset, y: -100 },
                { x: this.width / 3 + this.offset + randomOffset, y: this.height / 3 },
                { x: (2 * this.width) / 3 + this.offset + randomOffset, y: (2 * this.height) / 3 },
                { x: this.width / 2 + this.offset + randomOffset, y: this.height + 100 }
            ];
        }
    }

    updatePoints() {
        const amplitude = this.height / 6;
        const frequency = 0.0005 * this.speed;
        
        if (this.direction === 'horizontal') {
            this.points[1].y = this.height / 2 + Math.sin(this.time * frequency) * amplitude + this.offset;
            this.points[2].y = this.height / 2 + Math.cos(this.time * frequency) * amplitude + this.offset;
        } else {
            this.points[1].x = this.width / 2 + Math.sin(this.time * frequency) * amplitude + this.offset;
            this.points[2].x = this.width / 2 + Math.cos(this.time * frequency) * amplitude + this.offset;
        }
        
        this.time += 1;
        this.age += 1;

        // Handle fade in/out
        if (this.fadeIn && this.opacity < 1) {
            this.opacity += 0.02;
            if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeIn = false;
            }
        }

        if (this.age > this.lifespan) {
            this.fadeOut = true;
        }

        if (this.fadeOut) {
            this.opacity -= 0.02;
        }
    }

    drawCurve(t) {
        const p0 = this.points[0];
        const p1 = this.points[1];
        const p2 = this.points[2];
        const p3 = this.points[3];

        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
        const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

        return { x, y };
    }

    render() {
        this.ctx.beginPath();
        const steps = 100;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.drawCurve(t);
            
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        
        // Create glow effect with opacity
        const rgba = this.color.replace('rgb', 'rgba').replace(')', `, ${this.opacity})`);
        this.ctx.strokeStyle = rgba;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add blur effect
        this.ctx.shadowColor = rgba;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
        
        // Draw leading point with glow
        const leadPoint = this.drawCurve((1 + Math.sin(this.time * 0.002)) / 2);
        this.ctx.beginPath();
        this.ctx.arc(leadPoint.x, leadPoint.y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = rgba;
        this.ctx.shadowColor = rgba;
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
    }

    isDead() {
        return this.opacity <= 0;
    }
}

class MultiCurveAnimation {
    constructor() {
        this.canvas = document.getElementById('canvas-container');
        this.ctx = this.canvas.getContext('2d');
        this.curves = [];
        this.maxCurves = 15; // Maximum number of curves at once
        this.colors = [
            'rgb(74, 144, 226)', // Blue
            'rgb(80, 227, 194)', // Cyan
            'rgb(255, 107, 107)', // Red
            'rgb(255, 217, 61)', // Yellow
            'rgb(255, 154, 139)', // Pink
            'rgb(148, 103, 189)', // Purple
            'rgb(82, 183, 136)', // Green
        ];
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.init();
    }

    createNewCurve() {
        const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        const offset = (Math.random() - 0.5) * this.height * 0.9;
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const speed = 10 + Math.random() * 5;
        const lifespan = Math.random() * 500 + 300;

        return new BezierCurve(this.canvas, {
            color,
            offset,
            direction,
            speed,
            lifespan
        });
    }

    init() {
        this.curves = [];
        // Create initial set of curves
        for (let i = 0; i < this.maxCurves; i++) {
            this.curves.push(this.createNewCurve());
        }
    }

    manageCurves() {
        // Remove dead curves
        this.curves = this.curves.filter(curve => !curve.isDead());

        // Add new curves if below maximum
        while (this.curves.length < this.maxCurves) {
            this.curves.push(this.createNewCurve());
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.curves.forEach(curve => {
            curve.updatePoints();
            curve.render();
        });

        this.manageCurves();
    }

    animate() {
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize animation on page load
window.addEventListener('load', () => {
    new MultiCurveAnimation();
    
    // Smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});