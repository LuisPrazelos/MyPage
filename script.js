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

    // --- Project Explorer ---
    const projectData = window.projectExplorerData;
    const projectList = document.getElementById('project-list');
    const projectFilters = document.getElementById('project-filters');
    const projectVisual = document.getElementById('project-visual');
    const projectDetail = document.getElementById('project-detail');
    const projectCount = document.getElementById('project-count');
    const selectedProjectLabel = document.getElementById('selected-project-label');

    if (Array.isArray(projectData) && projectList && projectFilters && projectVisual && projectDetail) {
        const filters = ['All', ...new Set(projectData.map(project => project.category))];
        let activeFilter = 'All';
        let selectedProjectId = projectData[0]?.id || null;

        const renderFilters = () => {
            projectFilters.innerHTML = '';

            filters.forEach(filter => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `filter-chip${filter === activeFilter ? ' active' : ''}`;
                button.textContent = filter;
                button.addEventListener('click', () => {
                    activeFilter = filter;
                    const visibleProjects = getVisibleProjects();
                    if (!visibleProjects.some(project => project.id === selectedProjectId)) {
                        selectedProjectId = visibleProjects[0]?.id || null;
                    }
                    renderFilters();
                    renderProjectList();
                    renderSelectedProject();
                });
                projectFilters.appendChild(button);
            });
        };

        const getVisibleProjects = () => {
            if (activeFilter === 'All') {
                return projectData;
            }
            return projectData.filter(project => project.category === activeFilter);
        };

        const renderProjectList = () => {
            const visibleProjects = getVisibleProjects();
            projectList.innerHTML = '';

            if (projectCount) {
                projectCount.textContent = `${visibleProjects.length} visible`;
            }

            if (!visibleProjects.length) {
                projectList.innerHTML = '<div class="project-empty">No projects in this filter yet.</div>';
                return;
            }

            visibleProjects.forEach((project, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `project-list-item${project.id === selectedProjectId ? ' active' : ''}`;
                button.setAttribute('aria-pressed', project.id === selectedProjectId ? 'true' : 'false');
                button.innerHTML = `
                    <div class="project-list-meta">
                        <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
                        <span class="project-status-badge">${project.statusLabel}</span>
                    </div>
                    <h3>${project.title}</h3>
                    <p>${project.teaser}</p>
                `;
                button.addEventListener('click', () => {
                    selectedProjectId = project.id;
                    renderProjectList();
                    renderSelectedProject();
                });
                projectList.appendChild(button);
            });
        };

        const renderSelectedProject = () => {
            const visibleProjects = getVisibleProjects();
            const project = visibleProjects.find(item => item.id === selectedProjectId) || visibleProjects[0];

            if (!project) {
                if (selectedProjectLabel) {
                    selectedProjectLabel.textContent = 'No project selected';
                }
                projectVisual.innerHTML = '<div class="project-visual-placeholder">Select a project to load its details.</div>';
                projectDetail.innerHTML = '';
                return;
            }

            selectedProjectId = project.id;

            if (selectedProjectLabel) {
                selectedProjectLabel.textContent = `${project.category} / ${project.year}`;
            }

            const visualMedia = project.image
                ? `<img src="${project.image}" alt="${project.imageAlt}" style="object-position: ${project.imagePosition || 'center center'};">`
                : `<div class="project-visual-placeholder">Preview coming soon for ${project.title}</div>`;

            projectVisual.innerHTML = `
                ${visualMedia}
                <div class="project-visual-overlay">
                    <div class="project-phase" data-status="${project.status}">${project.statusLabel}</div>
                    <div class="project-snapshot">
                        <span>Why it matters</span>
                        <p>${project.snapshot}</p>
                    </div>
                </div>
            `;

            projectDetail.innerHTML = `
                <div class="project-detail-header">
                    <h2>${project.title}</h2>
                    <p>${project.teaser}</p>
                </div>
                <div class="project-detail-grid">
                    <div class="project-metric">
                        <span class="project-metric-label">Category</span>
                        <div class="project-metric-value">${project.category}</div>
                    </div>
                    <div class="project-metric">
                        <span class="project-metric-label">Status</span>
                        <div class="project-metric-value">${project.statusLabel}</div>
                    </div>
                    <div class="project-metric">
                        <span class="project-metric-label">Main Challenge</span>
                        <div class="project-metric-value">${project.challenge}</div>
                    </div>
                    <div class="project-metric">
                        <span class="project-metric-label">Outcome</span>
                        <div class="project-metric-value">${project.outcome}</div>
                    </div>
                </div>
                <div class="project-description">
                    ${project.description.map(paragraph => `<p>${paragraph}</p>`).join('')}
                </div>
                <div class="project-tag-row">
                    ${project.stack.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                </div>
            `;
        };

        renderFilters();
        renderProjectList();
        renderSelectedProject();
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
            const isDark = document.body.classList.contains('dark-mode');
            ctx.fillStyle = this.getColor();
            ctx.shadowBlur = isDark ? 10 : 0;
            ctx.shadowColor = isDark ? this.getGlowColor() : 'transparent';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        getColor() {
            const isDark = document.body.classList.contains('dark-mode');
            if (this.colorType === 'red') {
                return isDark ? '#ff6b4a' : '#c2410c';
            } else if (this.colorType === 'orange') {
                return isDark ? '#fb923c' : '#d97706';
            }
            return isDark ? 'rgba(226, 232, 240, 0.88)' : 'rgba(51, 65, 85, 0.5)';
        }

        getGlowColor() {
            if (this.colorType === 'red') return 'rgba(255, 107, 74, 0.7)';
            if (this.colorType === 'orange') return 'rgba(251, 146, 60, 0.65)';
            return 'rgba(226, 232, 240, 0.45)';
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
                            this.ctx.strokeStyle = isDark ? `rgba(191, 219, 254, ${opacity * 0.28})` : `rgba(51, 65, 85, ${opacity * 0.24})`;
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
