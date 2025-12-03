// Check for saved theme preference or use system preference
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

// Sync toggle switch with theme on page load
document.addEventListener('DOMContentLoaded', function() {
  updateToggleSwitch();
});

function updateToggleSwitch() {
  const toggleCircle = document.getElementById('toggleCircle');
  const toggleBg = document.getElementById('toggleBg');
  const isDark = document.documentElement.classList.contains('dark');
  
  if (toggleCircle && toggleBg) {
    if (isDark) {
      toggleCircle.style.transform = 'translateX(1.75rem)';
    } else {
      toggleCircle.style.transform = 'translateX(0)';
    }
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
  
  updateToggleSwitch();
}
