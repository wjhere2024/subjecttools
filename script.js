// Animation state
let isAnimating = false;
let animationInterval = null;
let moleculeInterval = null;
let molecules = [];

// DOM elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sun = document.getElementById('sun');
const heatWaves = document.getElementById('heatWaves');
const water = document.getElementById('water');
const moleculeContainer = document.getElementById('moleculeContainer');
const vaporContainer = document.getElementById('vaporContainer');

// Initialize molecules in water
function initMolecules() {
    moleculeContainer.innerHTML = '';
    molecules = [];
    
    // Create 20 molecules in the water
    for (let i = 0; i < 20; i++) {
        const molecule = document.createElement('div');
        molecule.className = 'molecule';
        
        // Random position within the water container
        const x = Math.random() * 240 + 10; // Keep within bowl width
        const y = Math.random() * 60 + 20;  // Keep in lower part of water
        
        molecule.style.left = x + 'px';
        molecule.style.bottom = y + 'px';
        
        moleculeContainer.appendChild(molecule);
        molecules.push({
            element: molecule,
            originalX: x,
            originalY: y,
            evaporated: false
        });
    }
    
    // Add some animated movement to molecules in water
    molecules.forEach(mol => {
        const randomDelay = Math.random() * 2;
        mol.element.style.animation = `moleculeFloat 3s ease-in-out infinite ${randomDelay}s`;
    });
}

// CSS for molecule floating animation (injected dynamically)
const style = document.createElement('style');
style.textContent = `
    @keyframes moleculeFloat {
        0%, 100% {
            transform: translate(0, 0);
        }
        25% {
            transform: translate(3px, -2px);
        }
        50% {
            transform: translate(-2px, 2px);
        }
        75% {
            transform: translate(2px, -3px);
        }
    }
`;
document.head.appendChild(style);

// Start evaporation animation
function startEvaporation() {
    let moleculeIndex = 0;
    
    moleculeInterval = setInterval(() => {
        if (moleculeIndex < molecules.length && isAnimating) {
            const mol = molecules[moleculeIndex];
            
            if (!mol.evaporated) {
                evaporateMolecule(mol);
                mol.evaporated = true;
            }
            
            moleculeIndex++;
            
            // Reset index to create continuous animation
            if (moleculeIndex >= molecules.length) {
                moleculeIndex = 0;
                // Reset evaporated state for continuous loop
                molecules.forEach(m => m.evaporated = false);
            }
        }
    }, 800); // Evaporate one molecule every 0.8 seconds
}

// Evaporate a single molecule
function evaporateMolecule(mol) {
    const molecule = mol.element;
    
    // Generate random path for evaporation
    const midX = (Math.random() - 0.5) * 50;
    const midY = -150 + (Math.random() * 30);
    const endX = (Math.random() - 0.5) * 100;
    const endY = -300 - (Math.random() * 50);
    
    molecule.style.setProperty('--mid-x', midX + 'px');
    molecule.style.setProperty('--mid-y', midY + 'px');
    molecule.style.setProperty('--end-x', endX + 'px');
    molecule.style.setProperty('--end-y', endY + 'px');
    
    // Add evaporating class
    molecule.classList.add('evaporating');
    
    // Create vapor molecule at the top
    setTimeout(() => {
        createVaporMolecule();
    }, 2500);
    
    // Reset molecule after animation
    setTimeout(() => {
        molecule.classList.remove('evaporating');
        molecule.style.removeProperty('--mid-x');
        molecule.style.removeProperty('--mid-y');
        molecule.style.removeProperty('--end-x');
        molecule.style.removeProperty('--end-y');
    }, 3000);
}

// Create vapor molecules at the top
function createVaporMolecule() {
    const vapor = document.createElement('div');
    vapor.className = 'vapor-molecule';
    
    // Random position in vapor area
    const x = Math.random() * 400 + 50;
    const y = Math.random() * 100 + 50;
    
    vapor.style.left = x + 'px';
    vapor.style.top = y + 'px';
    vapor.style.animationDelay = Math.random() * 2 + 's';
    
    vaporContainer.appendChild(vapor);
    
    // Remove vapor molecule after some time to avoid cluttering
    setTimeout(() => {
        vapor.style.transition = 'opacity 1s';
        vapor.style.opacity = '0';
        setTimeout(() => {
            vapor.remove();
        }, 1000);
    }, 5000);
}

// Start animation
function startAnimation() {
    if (isAnimating) return;
    
    isAnimating = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // Activate sun and heat waves
    sun.classList.add('active');
    heatWaves.classList.add('active');
    
    // Start evaporation process
    startEvaporation();
}

// Pause animation
function pauseAnimation() {
    if (!isAnimating) return;
    
    isAnimating = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Deactivate sun and heat waves
    sun.classList.remove('active');
    heatWaves.classList.remove('active');
    
    // Stop evaporation
    if (moleculeInterval) {
        clearInterval(moleculeInterval);
        moleculeInterval = null;
    }
}

// Reset animation
function resetAnimation() {
    pauseAnimation();
    
    // Clear all vapor molecules
    vaporContainer.innerHTML = '';
    
    // Re-initialize water molecules
    initMolecules();
    
    // Reset buttons
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Event listeners
startBtn.addEventListener('click', startAnimation);
pauseBtn.addEventListener('click', pauseAnimation);
resetBtn.addEventListener('click', resetAnimation);

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initMolecules();
});

// Add some initial vapor molecules for visual effect
window.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const vapor = document.createElement('div');
            vapor.className = 'vapor-molecule';
            vapor.style.left = Math.random() * 400 + 50 + 'px';
            vapor.style.top = Math.random() * 100 + 50 + 'px';
            vapor.style.animationDelay = Math.random() * 2 + 's';
            vapor.style.opacity = '0.3';
            vaporContainer.appendChild(vapor);
        }, i * 200);
    }
});
