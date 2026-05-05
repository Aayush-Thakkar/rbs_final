document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // 3. Video Intersection Observer (Safari-Optimized)
    const video = document.querySelector('.hero-video');
    
    if (video) {
        // Safari strict requirement: explicitly set muted via JS as a backup
        video.muted = true;
        // Ensure playsInline is set via JS as well for iOS Safari
        video.setAttribute('playsinline', ''); 

        // Initial play attempt to satisfy Safari's promise requirements
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // This usually triggers if Safari is in Low Power Mode
                console.log("Autoplay blocked by Safari. Showing poster image instead.", error);
            });
        }

        // Check for data-saver mode
        if ('connection' in navigator && navigator.connection.saveData) {
            video.pause();
        } else {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Only call play if the video is actually paused to avoid 
                        // interrupting Safari's native autoplay sequence
                        if (video.paused) {
                            video.play().catch(e => console.log('Scroll autoplay prevented:', e));
                        }
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.1 });
            
            videoObserver.observe(document.querySelector('.hero'));
        }
    }

    // 4. Form Submission Handling
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (contactForm) {
        const submitBtn = contactForm.querySelector('.btn-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner');

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            btnText.classList.add('hidden');
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    formStatus.textContent = 'Thank you! Your message has been sent successfully.';
                    formStatus.classList.add('status-success');
                    contactForm.reset();
                } else {
                    formStatus.textContent = result.error || 'An error occurred. Please try again.';
                    formStatus.classList.add('status-error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                formStatus.textContent = 'Network error. Please try again or use WhatsApp.';
                formStatus.classList.add('status-error');
            } finally {
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    }

    // Portfolio Dot Slider
    const track = document.getElementById('portfolioTrack');
    const dotsContainer = document.getElementById('portfolioDots');

    if (track && dotsContainer) {
        const cards = track.querySelectorAll('.portfolio-card');
        let current = 0;

        const getVisible = () => window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;

        const totalSlides = () => Math.ceil(cards.length / getVisible());

        const buildDots = () => {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < totalSlides(); i++) {
                const dot = document.createElement('button');
                dot.className = 'portfolio-dot' + (i === current ? ' active' : '');
                dot.setAttribute('aria-label', `Slide ${i + 1}`);
                dot.addEventListener('click', () => goTo(i));
                dotsContainer.appendChild(dot);
            }
        };

        const goTo = (index) => {
            current = Math.max(0, Math.min(index, totalSlides() - 1));
            const cardWidth = cards[0].offsetWidth + 24;
            track.style.transform = `translateX(-${current * getVisible() * cardWidth}px)`;
            dotsContainer.querySelectorAll('.portfolio-dot').forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        };

        buildDots();
        window.addEventListener('resize', () => { current = 0; buildDots(); goTo(0); });
    }

    // 5. Scroll Animations
    const fadeElements = document.querySelectorAll('.portfolio-card, .service-card, .testimonial-card');

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => scrollObserver.observe(el));

    // 5a. Stat Counter Animation
    const statEls = document.querySelectorAll('.stat h4[data-target]');
    const suffixes = { '25': '+', '3': '+', '98': '%' };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = +el.dataset.target;
                const suffix = suffixes[el.dataset.target] || '';
                const duration = 850;
                const step = 16;
                const increment = target / (duration / step);
                let current = 0;

                const tick = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        el.textContent = target + suffix;
                        clearInterval(tick);
                    } else {
                        el.textContent = Math.floor(current) + suffix;
                    }
                }, step);

                observer.unobserve(el);
            }
        });
    }, { threshold: 0.6 });

    statEls.forEach(el => counterObserver.observe(el));

    // 5b. Process Exhibit Sequential Animation
    const processExhibit = document.getElementById('flowchart');
    if (processExhibit) {
        const steps = processExhibit.querySelectorAll('.exhibit-step');
        const connectors = processExhibit.querySelectorAll('.exhibit-connector');

        const exhibitObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    steps.forEach((step, i) => {
                        setTimeout(() => {
                            step.classList.add('visible');
                            if (i === 0) step.classList.add('active');
                            if (connectors[i]) {
                                setTimeout(() => {
                                    connectors[i].classList.add('visible');
                                    step.classList.remove('active');
                                    if (steps[i + 1]) steps[i + 1].classList.add('active');
                                }, 300);
                            }
                        }, i * 500);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        exhibitObserver.observe(processExhibit);
    }

    // 6. Three.js Particle System (Ambient Dust/Glow over Video)
    const canvas = document.getElementById('hero-particles');
    if (canvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();

        // Setup Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        // Setup Renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create Particles Geometry
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 200; // Lightweight count for performance
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            // Spread particles across the screen
            posArray[i] = (Math.random() - 0.5) * 15;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        // Create Soft Glowing Material
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.03,
            color: 0xc8ab79, // Updated to Champagne Brass
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleMesh);

        // Mouse interaction logic
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) - 0.5;
            mouseY = (event.clientY / window.innerHeight) - 0.5;
        });

        const clock = new THREE.Clock();

        // Animation Loop
        function animateParticles() {
            requestAnimationFrame(animateParticles);
            const elapsedTime = clock.getElapsedTime();

            // Smooth mouse follow
            targetX = mouseX * 0.5;
            targetY = mouseY * 0.5;

            // Slowly rotate the entire system
            particleMesh.rotation.y = elapsedTime * 0.02;
            particleMesh.rotation.x = elapsedTime * 0.01;

            // Apply parallax based on mouse
            particleMesh.position.x += (targetX - particleMesh.position.x) * 0.02;
            particleMesh.position.y += (-targetY - particleMesh.position.y) * 0.02;

            // Make individual particles drift upwards
            const positions = particleMesh.geometry.attributes.position.array;
            for (let i = 1; i < particlesCount * 3; i += 3) {
                positions[i] += 0.001; // Upward drift speed
                if (positions[i] > 7.5) {
                    positions[i] = -7.5; // Reset to bottom
                }
            }
            particleMesh.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }

        animateParticles();

        // Handle Window Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});