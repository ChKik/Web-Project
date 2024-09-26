// const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
// const contentSections = document.querySelectorAll('#content main');
// const allContentSections = document.querySelectorAll('.content-section');
// const menuBar = document.querySelector('#content nav .bx.bx-menu');
// const sidebar = document.getElementById('sidebar');
// const sections = document.querySelectorAll("#content main.content-section");

allSideMenu.forEach(item => {
  const li = item.parentElement;

  item.addEventListener('click', function () {
    const sectionId = item.getAttribute('data-section');
    allSideMenu.forEach(i => {
      i.parentElement.classList.remove('active');
    });
    li.classList.add('active');

    // Toggle visibility based on the selected section
    allContentSections.forEach(content => {
      content.classList.remove('active');
    });

    console.log(sectionId + '-content');
    document.getElementById(sectionId + '-content').classList.add('active');
  });
});

menuBar.addEventListener('click', function () {
  sidebar.classList.toggle('hide');
});
 
// gia to json 

let products = [];

document.addEventListener("DOMContentLoaded", () => {

  // Function to fetch categories and populate the select element
  function fetchCategories() {
    // Select the category dropdown element
    const categorySelect = document.querySelector('select.category');

    // Ensure the element exists
    if (!categorySelect) {
      console.error('Select element with class "category" not found!');
      return;
    }

    // Make a GET request to the /api/get_categories endpoint
    fetch('http://localhost:3000/api/get_categories')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(categories => {
        // Clear existing options except for the first placeholder option
        categorySelect.innerHTML = '<option selected>Choose a category</option>';

        if (categories.length > 0) {
          categories.forEach(category => {
            // Create a new option element for each category
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;

            // Append the option to the select element
            categorySelect.appendChild(option);
          });
        } else {
          // If no categories, add a default option
          const noOption = document.createElement('option');
          noOption.textContent = 'No categories available';
          categorySelect.appendChild(noOption);
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
      });
  }

  function addItem() {
    const itemForm = document.querySelector('form#item-form');
  
    if (!itemForm) {
      console.error('Form element with ID "item-form" not found!');
      return;
    }
  
    itemForm.addEventListener('submit', event => {
      event.preventDefault();
  
      // Fetch categories again here
      fetchCategories();
  
      const nameInput = document.querySelector('input#item-name');
      const descriptionInput = document.querySelector('textarea#item-description');
      const quantityInput = document.querySelector('input#item-quantity');
      const categorySelect = document.querySelector('select.category');
  
      if (!categorySelect) {
        console.error('Select element with class "category" not found!');
        return;
      }
  
      const selectedCategory = categorySelect.options[categorySelect.selectedIndex].text;
  
      fetch('http://localhost:3000/api/add_item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nameInput.value,
          description: descriptionInput.value,
          quantity: quantityInput.value,
          category: selectedCategory
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        itemForm.reset();
        alert('Item added successfully!');
      })
      .catch(error => {
        console.error('Error adding item:', error);
        alert('An error occurred while adding the item.');
      });
    });
  }


  // Function to fetch categories and populate the modal
  function populateEditWarehouseModal() {
    const editCategoriesDiv = document.getElementById('edit-categories');

    if (!editCategoriesDiv) {
      console.error('Div element with ID "edit-categories" not found!');
      return;
    }

    // Make a GET request to the /api/get_categories endpoint
    fetch('http://localhost:3000/api/get_categories')
      .then(response => response.json())
      .then(categories => {
        // Clear existing content
        editCategoriesDiv.innerHTML = '';

        if (categories.length > 0) {
          categories.forEach(category => {
            // Create a new button element for each category
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.dataset.categoryId = category.id; // Store category ID
            button.textContent = category.name; // Show category name

            // Append the button to the edit-categories div
            editCategoriesDiv.appendChild(button);
          });
        } else {
          // If no categories, display a message
          const noCategoriesMessage = document.createElement('p');
          noCategoriesMessage.textContent = 'No categories available';
          editCategoriesDiv.appendChild(noCategoriesMessage);
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
      });
  }

  // Function to populate items when a category is clicked in the modal
  function fetchAndDisplayItemsByCategory(categoryId) {
    fetch(`http://localhost:3000/api/get_items_by_category/${categoryId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(items => {
        // Select the element where the items will be displayed
        const itemList = document.getElementById('item-list-modal');
        itemList.innerHTML = '';
  
        if (items.length > 0) {
          items.forEach(item => {
            const itemElement = document.createElement('li');
            itemElement.textContent = `${item.prod_item} - ${item.prod_description} (Quantity: ${item.totalQuantity || 0})`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteItem(item.prod_id));
            const editQuantityForm = document.createElement('form');
            editQuantityForm.innerHTML = `
              <label for="new-quantity">New Quantity:</label>
              <input type="number" id="new-quantity" value="${item.totalQuantity || 0}" min="0" required>
              <button type="submit">Update Quantity</button>
            `;
            editQuantityForm.addEventListener('submit', (e) => {
              e.preventDefault();
              const newQuantity = e.target.elements['new-quantity'].value;
              updateItemQuantity(item.prod_id, newQuantity);
            });
            itemElement.appendChild(deleteButton);
            itemElement.appendChild(editQuantityForm);
            itemList.appendChild(itemElement);
          });
        } else {
          itemList.textContent = 'No items available.';
        }
      })
      .catch(error => {
        console.error('Error fetching items by category:', error);
      });
  }

  // Function to update item quantity
  function updateItemQuantity(itemId, newQuantity) {
    if (confirm(`Are you sure you want to update the quantity of item ${itemId} to ${newQuantity}?`)) {
      fetch(`http://localhost:3000/api/update_item_quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, newQuantity })  // deleted quantity:
      })
        .then(response => response.json())
        .then(data => {
          console.log('Quantity updated:', data);
          fetchAndDisplayItemsByCategory(data.categoryId);
        })
        .catch(error => {
          console.error('Error updating quantity:', error);
        });
    }
  }

  // Function to delete an item
  function deleteItem(itemId) {
    if (confirm(`Are you sure you want to delete item ${itemId}?`)) {
      fetch(`http://localhost:3000/api/delete_item/${itemId}`, {
        method: 'DELETE'
      })
        .then(response => response.json())
        .then(data => {
          console.log('Item deleted:', data);
          fetchAndDisplayItemsByCategory(data.categoryId);
        })
        .catch(error => {
          console.error('Error deleting item:', error);
        });
    }
  }

  document.getElementById('upload-json-btn').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          products = JSON.parse(e.target.result); // Store the parsed products in the global variable
          showInsertModal(products);
        } catch (err) {
          alert('Error parsing JSON: ' + err.message);
        }
      };
      
      reader.readAsText(file);
    };
    input.click();
  });

  function processProducts(products) {
    console.log('Products:', products);
    fetch('http://localhost:3000/api/upload-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(products)
    }).then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
  }

  // MODAL JSON 

  function showInsertModal(products) {
    const modal = document.getElementById('products-insert-modal');
    const productList = document.getElementById('product-list-modal');
    productList.innerHTML = ''; // Clear existing content
 
    products.forEach(product => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <span><strong>Category:</strong> ${product.prod_category_id}</span>
        <span><strong>Name:</strong> ${product.prod_item}</span>
        <span><strong>Description:</strong> ${product.prod_description}</span>
        <span><strong>Quantity:</strong> ${product.totalQuantity}</span>
      `;
      productList.appendChild(listItem);
    });
 
    modal.style.display = 'block'; // Show the modal
  }
 
  // Close modal when the 'X' is clicked
  document.querySelector('#products-insert-modal .close').addEventListener('click', () => {
    document.getElementById('products-insert-modal').style.display = 'none';
  });
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('products-insert-modal')) {
      document.getElementById('products-insert-modal').style.display = 'none';
    }
  });
  
  // Insert to Database button functionality
  document.getElementById('insert-to-db-btn').addEventListener('click', () => {
    // Your existing function to handle inserting data to the database
    // After successful insertion, show a success message
    processProducts(products);            // edwww
    alert('Products inserted successfully!');
    document.getElementById('products-insert-modal').style.display = 'none';
  });
  
  // Cancel Insert button functionality
  document.getElementById('cancel-insert-btn').addEventListener('click', () => {
    document.getElementById('products-insert-modal').style.display = 'none';
  });

  // MODAL JSON END 

  // Trigger the modal to open and populate categories
  const openModalBtn = document.getElementById('open-modal-btn');
  const editWarehouseModal = document.getElementById('edit-warehouse-modal');
  const closeModalBtn = document.querySelector('#edit-warehouse-modal .close');

  if (openModalBtn && editWarehouseModal) {
    openModalBtn.addEventListener('click', () => {
      populateEditWarehouseModal();
      editWarehouseModal.style.display = 'block';
    });
  }

  // Close modal when the 'X' is clicked
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      editWarehouseModal.style.display = 'none';
    });
  }

  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === editWarehouseModal) {
      editWarehouseModal.style.display = 'none';
    }
  });

  // Event listener for category buttons in the modal
  document.addEventListener('click', event => {
    if (event.target.classList.contains('category-btn')) {
      const categoryId = event.target.dataset.categoryId;
      fetchAndDisplayItemsByCategory(categoryId);
    }
  });

  const saveButton = document.getElementById('save-changes-btn');

  // Add a new HTML element for the popup modal
const popupModal = document.createElement('div');
popupModal.innerHTML = 'Changes saved!';
popupModal.style.position = 'fixed';
popupModal.style.top = '50%';
popupModal.style.left = '50%';
popupModal.style.transform = 'translate(-50%, -50%)';
popupModal.style.background = 'white';
popupModal.style.padding = '10px';
popupModal.style.border = '1px solid #ccc';
popupModal.style.borderRadius = '5px';
popupModal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
popupModal.style.display = 'none'; // initially hide the popup modal

// Add the popup modal to the page
document.body.appendChild(popupModal);

// Show the popup modal when the save button is clicked
saveButton.addEventListener('click', (e) => {
  editWarehouseModal.style.display = 'none'; // close the edit modal
  popupModal.style.display = 'block'; // show the popup modal
  setTimeout(() => {
    popupModal.style.display = 'none'; // hide the popup modal after 2 seconds
  }, 2000);
});

  // saveButton.addEventListener('click', (e) => {
  //   editWarehouseModal.style.display = 'none';
  // });

  fetchCategories();
  addItem();
  populateEditWarehouseModal();
  //fetchAndDisplayItemsByCategory();

});

