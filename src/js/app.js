App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load merch.
    $.getJSON('../merch.json', function(data) {
      var merchRow = $('#merchRow');
      var merchTemplate = $('#merchTemplate');

      for (i = 0; i < data.length; i ++) {
        merchTemplate.find('.panel-title').text(data[i].name);
        merchTemplate.find('img').attr('src', data[i].picture);
        merchTemplate.find('.merch-size').text(data[i].size);
        merchTemplate.find('.merch-color').text(data[i].color);
        merchTemplate.find('.merch-brand').text(data[i].brand);
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
  },

  markBought: () => {
    App.contracts.Buy.deployed().then((instance) => {
      return instance.getMerchs.call();
    }).then((merchs) => {
      for (i = 0; i < merchs.length; i++) {
        if (merchs[i] !== '0x0000000000000000000000000000000000000000') {
          $('.fondoBoton').eq(i).find('button').text('Agotada').attr('disabled', true);
        }
      }
    }).catch(err => {
      console.log(err.message);
    });
  },

  handleBuy: function(event) {
    event.preventDefault();
  
    var merchId = parseInt($(event.target).data('id'));

    var getValue = new Promise((resolve) => {
      ($.getJSON('../merch.json', function(data) {
        var price = data[merchId].price;
        resolve (price);
      }));
    });
  
    web3.eth.getAccounts(async (error, accounts) => {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      var buyInstance = await App.contracts.Buy.deployed();
      var value = await getValue
      await buyInstance.buy(merchId, {from: account, value });
      App.markBought();

    });
  }
  

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
