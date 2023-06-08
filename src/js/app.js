
App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    $.getJSON('../merch.json', function(data) {
      var merchRow = $('#merchRow');
      var merchTemplate = $('#merchTemplate');

      for (i = 0; i < data.length; i ++) {
        merchTemplate.find('.panel-title').text(data[i].name);
        merchTemplate.find('img').attr('src', data[i].picture);
        merchTemplate.find('.merch-size').text(data[i].size);
        merchTemplate.find('.merch-color').text(data[i].color);
        merchTemplate.find('.merch-brand').text(data[i].brand);
        merchTemplate.find('.merch-stock').attr('data-id', data[i].id);
        merchTemplate.find('.merch-price').text((data[i].price / 10**18) + ' ETH');
        merchTemplate.find('.btn-buy').attr('data-id', data[i].id);
        
        merchRow.append(merchTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (e) {
        console.error('User denined account access...');
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: () => {
    $.getJSON('Buy.json', (data) => {
      App.contracts.Buy = TruffleContract(data);
      App.contracts.Buy.setProvider(App.web3Provider);
      return App.markBought();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-buy', App.handleBuy);
    $(document).on('click', '#btnShowPurchases', App.showPurchases);
  },

  showPurchases: () => {
    App.contracts.Buy.deployed().then(async (instance) => {
      web3.eth.getAccounts(async (error, accounts) => {
        if (error) {
        console.log(error);
        return;
        }
        var account = accounts[0];
        const merchCount = await instance.getMerchCount();
        const purchases = [];
        for (let i = 0; i < merchCount; i++) {
          const buyers = await instance.getBuyers(i);
          purchases.push(0);
          let count = 0;
          for (let j = 0; j < buyers.length; j++) {
            
            if (buyers[j] == account) {
              count++;
            }
          }
          purchases[i] = count;
        }
        console.log(purchases);
     
        $.getJSON('../merch.json', function(data) {
          var filteredPurchases = [];
          for (let i = 0; i < purchases.length; i++) {
            if (purchases[i] > 0) {
              filteredPurchases.push({
                id: i,
                name: data[i].name,
                picture: data[i].picture,
                size: data[i].size,
                color: data[i].color,
                brand: data[i].brand,
                price: data[i].price,
                quantity: purchases[i]
              });
            }
          }

          // Llamar a la función para mostrar los datos en la interfaz y abrir el modal
          App.displayPurchases(account, filteredPurchases);
          $('#purchasesModal').modal('show');
        });

      });
    }).catch((error) => {
    console.log(error);
    });
    },

    displayPurchases: function(account,purchases) {
      var purchasesContainer = $('#purchasesContainer');
      purchasesContainer.empty();
      var accountContainer = $('#modal-account');
      accountContainer.empty();
      accountContainer.append(`<strong>Cuenta:</strong> <span class="merch-cuenta"" >${account}</span>`);
      for (var i = 0; i < purchases.length; i++) {
        var merchTemplate = `
          <div class="merch-purchase">
            <h3 class="panel-title-modal">${purchases[i].name}</h3>
            <img class="merch-picture" src="${purchases[i].picture}" alt="${purchases[i].name}">
            <div class="merch-details">
              <strong>Color:</strong> <span class="merch-color">${purchases[i].color}</span><br/>
              <strong>Talla:</strong> <span class="merch-size">${purchases[i].size}</span><br/>
              <strong>Marca:</strong> <span class="merch-brand">${purchases[i].brand}</span><br/>
              <strong>Precio:</strong> <span class="merch-price">${(purchases[i].price / 10**18)} ETH</span><br/>
              <strong>Cantidad Comprada:</strong> <span class="merch-quantity">${purchases[i].quantity}</span>
            </div>
          </div>
        `;
        purchasesContainer.append(merchTemplate);
      }
    },
    
  markBought: () => {
    App.contracts.Buy.deployed().then((instance) => {
      $.getJSON('../merch.json', function(data) {
        for (let i = 0; i < data.length; i++) {
          instance.getBuyers(i).then((buyers) => {
            let stock = data[i].stock;
            let buyersCount = buyers.length;
            
            $('.merch-details').eq(i).find('.merch-stock').text(stock - buyersCount);
            if (buyersCount >= stock) {
              $('.fondoBoton').eq(i).find('button').text('Agotada').attr('disabled', true);
            }
          }).catch(err => {
            console.log(err.message);
          });
        }
      });
    }).catch(err => {
      console.log(err.message);
    });
  },
  

  handleBuy: function(event) {
    event.preventDefault();
  
    var merchId = parseInt($(event.target).data('id'));
    $('.fondoBoton').eq(merchId).find('button').attr('disabled', true);

    var getValue = new Promise((resolve) => {
      ($.getJSON('../merch.json', function(data) {
        var price = data[merchId].price;
        resolve (price);
      }));
    });
  
    web3.eth.getAccounts(async (error, accounts) => {
      if (error) {
        $('.fondoBoton').eq(merchId).find('button').attr('disabled', false);
        console.log(error);
      }
      var account = accounts[0];
      var buyInstance = await App.contracts.Buy.deployed();
      var value = await getValue
      try {
        await buyInstance.buy(merchId, { from: account, value });
        $('.fondoBoton').eq(merchId).find('button').attr('disabled', false);
        App.markBought();
      } catch (error) {
        console.log(error);
        $('.fondoBoton').eq(merchId).find('button').attr('disabled', false);
      }

    });
  }
  
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
