document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menu-button');
    const menuList = document.getElementById('menu-list');
  
    menuButton.addEventListener('click', function() {
      if (menuList.style.display === 'none' || menuList.style.display === '') {
        menuList.style.display = 'block';
      } else {
        menuList.style.display = 'none';
      }
    });
  });
  