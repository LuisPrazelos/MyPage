document.addEventListener('DOMContentLoaded', () => {
    // Reveal targeted elements smoothly on scroll
    const animatedElements = document.querySelectorAll('.fade-up, .slide-in-left, .slide-in-right, .scale-in');
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Remove class when element leaves the viewport so animation replays on scroll-up
                entry.target.classList.remove('visible');
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });

    animatedElements.forEach(el => observer.observe(el));

    // Global mouse tracking for CSS Variables (flashlight effect)
    document.addEventListener('mousemove', (e) => {
        // Spotlight grid and background glow
        document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
        
        // Localized spotlight on cards
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // --- Theme Switching Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            // Save preference
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }
    // --- Neural Grid Background Animation ---
    class Particle {
        constructor(canvas) {
            this.canvas = canvas;
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            
            // Weighted color selection: Majority Gray, some Red and Orange
            const roll = Math.random();
            if (roll > 0.92) this.colorType = 'red';
            else if (roll > 0.85) this.colorType = 'orange';
            else this.colorType = 'gray';
        }

        draw(ctx) {
            ctx.fillStyle = this.getColor();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        getColor() {
            const isDark = document.body.classList.contains('dark-mode');
            if (this.colorType === 'red') {
                return isDark ? '#ff4b2b' : '#e3350d';
            } else if (this.colorType === 'orange') {
                return isDark ? '#f97316' : '#ea580c';
            }
            return isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.25)';
        }

        update(mouse) {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x > this.canvas.width) this.x = 0;
            if (this.x < 0) this.x = this.canvas.width;
            if (this.y > this.canvas.height) this.y = 0;
            if (this.y < 0) this.y = this.canvas.height;

            // Mouse Interaction (Attraction)
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 250) {
                    let forceX = dx / distance;
                    let forceY = dy / distance;
                    let strength = (250 - distance) / 250;
                    this.x += forceX * strength * 0.8;
                    this.y += forceY * strength * 0.8;
                }
            }
        }
    }

    class NeuralNetwork {
        constructor() {
            this.canvas = document.getElementById('neural-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: null, y: null };
            this.resize();
            this.init();
            this.animate();

            window.addEventListener('resize', () => {
                this.resize();
                this.init();
            });

            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        init() {
            this.particles = [];
            let particleCount = (this.canvas.width * this.canvas.height) / 15000;
            particleCount = Math.min(particleCount, 150);
            for (let i = 0; i < particleCount; i++) {
                this.particles.push(new Particle(this.canvas));
            }
        }

        connect() {
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    let dx = this.particles[i].x - this.particles[j].x;
                    let dy = this.particles[i].y - this.particles[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        let opacity = 1 - (distance / 150);
                        const isDark = document.body.classList.contains('dark-mode');
                        
                        // Color of the line depends on the nodes it connects
                        if (this.particles[i].colorType === 'red' || this.particles[j].colorType === 'red') {
                            this.ctx.strokeStyle = `rgba(255, 75, 43, ${opacity * 0.4})`;
                        } else if (this.particles[i].colorType === 'orange' || this.particles[j].colorType === 'orange') {
                            this.ctx.strokeStyle = `rgba(249, 115, 22, ${opacity * 0.4})`;
                        } else {
                            this.ctx.strokeStyle = isDark ? `rgba(148, 163, 184, ${opacity * 0.15})` : `rgba(100, 116, 139, ${opacity * 0.15})`;
                        }
                        
                        this.ctx.lineWidth = 0.8;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.stroke();
                    }
                }
            }
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach(p => {
                p.update(this.mouse);
                p.draw(this.ctx);
            });
            this.connect();
            requestAnimationFrame(() => this.animate());
        }
    }

    new NeuralNetwork();
});
