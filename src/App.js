import React, { Component } from 'react';
import Web3 from 'web3';
import { Footer } from 'react-bulma-components';

import FLTToken from './abis/FLTToken.json';
import Ether from './abis/Ether.json';
import Digilance from './abis/Digilance.json';

import './App.css';
import NavigationBar from './NavigationBar';

import RequestServiceForm from './RequestServiceScreen';
import SubmitWorkScreen from './SubmitWorkScreen';
import Spinner from './Spinner';
import ServiceRequests from './ServiceRequests';
import Services from './Services';
import BuyFLTScreen from './BuyFLT';
import SetAccountType from './SetAccountType';


class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  state = {
    account: '',
    serviceRequestsCount: 0,
    fltTokenBalance: 0,
    digilance: null,
    loading: false,
    // route: 'my-services',
    route: 'set-account-type',
    loadingButton: null,
    services: [],
    serviceRequests: [],
    showingBuyFLTModal: false,
    error: null,
    currentServiceIdx: null,
    isVoter: false,
  }

  loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  loadContract = async (contractName, contract, networkId, callback = () => { }) => {
    const { account } = this.state;
    const web3 = window.web3;
    // Load contract
    const contractData = contract.networks[networkId];
    if (contractData) {
      const loadedContract = new web3.eth.Contract(contract.abi, contractData.address)
      let balance = await loadedContract.methods?.balanceOf?.(account).call() || '';
      this.setState({ [contractName]: loadedContract, [`${contractName}Balance`]: balance.toString() }, callback);
    } else {
      window.alert(`${contractName} contract not deployed to detected network.`);
    }
  }

  loadBlockchainData = async () => {
    this.setState({ loading: true });
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();

    // Get account's ETH Balance
    const ETHBalance = await web3.eth.getBalance(accounts[0]);

    this.setState({ account: accounts[0], ETHBalance });
    const networkId = await web3.eth.net.getId();

    // Load FLTToken contract
    await this.loadContract('fltToken', FLTToken, networkId);

    // Load Ether contract
    await this.loadContract('etherToken', Ether, networkId);

    // load Digilance contract
    await this.loadContract('digilance', Digilance, networkId, async () => {
      const { digilance, account } = this.state;
      debugger;
      // Get account type
      const accountType = await digilance.methods.getAccountType().call();

      if (!accountType) {
        // User has not set account type, make them do that
        this.setState({ route: 'set-account-type'})
      }
      // Load last 10 service requests
      const serviceRequests = await digilance.methods.getLastNRequestedServices(10).call();

      // Load all articles I own or have written
      const services = await digilance.methods.getAllUserServices(account).call();

      this.setState({ serviceRequests, services, loading: false });
    });
  }

  setAccountType = (type) => {
    const {  digilance, account } = this.state;
    digilance.methods.setAccountType(type).send({ from: account })
      .on('receipt', async (receipt) => {
        this.setState({ route: 'my-services'});
      })
  }

  requestService = async (data) => {
    this.setState({ loading: true, error: null });
    const { digilance, account, fltToken, serviceRequests } = this.state;

    // Authorize the marketplace contract to make flt transactions on my behalf (pay freelancers)
    const rewardInWei = window.web3.utils.toWei(data.reward.toString(), 'ether'); // convert reward to Wei
    fltToken.methods.approve(digilance._address, rewardInWei).send({ from: account })
      .on('receipt', async () => {
        // Request a service
        digilance.methods.requestService(data.title, data.description, data.category, data.deadline, data.reward).send({ from: account })
          .on('receipt', async () => {
            const newRequest = await digilance.methods.serviceRequests(data.title).call();
            const fltTokenBalance = await fltToken.methods.balanceOf(account).call();
            const updatedServiceRequests = [...serviceRequests, newRequest];
            this.setState({ loading: false, serviceRequests: updatedServiceRequests, route: 'my-requests', fltTokenBalance });
          })
          .on('error', error => {
            console.error(error);
            this.setState({ loading: false, error: this.extractError(error) });
          })
          .on('error', error => {
            console.error(error);
            this.setState({ loading: false, error: this.extractError(error) });
          });
      });
  }

  acceptServiceRequest = (title, idx) => {
    this.setState({ loadingButton: idx, error: null });
    const { digilance, account, serviceRequests } = this.state;

    // Request a service
    digilance.methods.acceptServiceRequest(title).send({ from: account })
      .on('receipt', async (receipt) => {
        const acceptedServiceRequest = await digilance.methods.ServiceRequests(title).call();
        const updatedServiceRequests = [
          ...serviceRequests.slice(0, idx),
          acceptedServiceRequest,
          ...serviceRequests.slice(idx + 1)
        ];
        this.setState({ loadingButton: null, serviceRequests: updatedServiceRequests });
      })
      .on('error', error => {
        this.setState({ loading: false, error: this.extractError(error) });
      });
  }

  submitWork = (title, url) => {
    this.setState({ loading: true, error: null });
    const { digilance, account, services, } = this.state;

    // Submit a service
    digilance.methods.submitWork(title, url).send({ from: account })
      .on('receipt', async () => {
        const submittedWork = await digilance.methods.getAllServices(title).send({ from: account });
        const updatedServices = [
          ...services,
          submittedWork,
        ];
        this.setState({ services: updatedServices, route: 'my-services', loading: false });
      })
      .on('error', error => {
        this.setState({ loading: false, error: this.extractError(error) });
      });
  }

  approveService = (title, idx) => {
    this.setState({ loadingButton: idx, error: null });
    const { digilance, account, services } = this.state;

    // Approve a service
    digilance.methods.approveService(title).send({ from: account })
      .on('receipt', async () => {
        const approvedService = await digilance.methods.services(title).call();
        const updatedServices = [
          ...services.slice(0, idx),
          approvedService,
          ...services.slice(idx + 1)
        ];
        this.setState({ services: updatedServices, loadingButton: null });
      })
      .on('error', error => {
        this.setState({ loadingButton: null, error: this.extractError(error) });
      });
  }

  buyFLT = () => {
    this.setState({ showingBuyFLTModal: true, error: null });
  }

  hideModal = () => {
    this.setState({ showingBuyFLTModal: false, error: null });
  }

  purchaseFLT = async etherAmount => {
    this.setState({ loadingButton: true, error: null })
    const { freelanceMarketplace, etherToken, fltToken, account } = this.state;

    // Authorize the marketplace contract to make ether transactions on my behalf
    etherToken.methods.approve(freelanceMarketplace._address, etherAmount).send({ from: account }).on('receipt', async () => {
      freelanceMarketplace.methods.purchaseFLT(etherAmount).send({ from: account })
        .on('receipt', async () => {
          const etherTokenBalance = await etherToken.methods.balanceOf(account).call();
          const fltTokenBalance = await fltToken.methods.balanceOf(account).call();

          this.setState({ etherTokenBalance, fltTokenBalance, showingBuyFLTModal: false });
        })
        .on('error', error => {
          this.setState({ loadingButton: false, error: this.extractError(error) });
        });
    }).on('error', error => {
      this.setState({ loadingButton: false, error: error.message });
    });
  }

  extractError = error => {
    const str = error.message;
    const startIndex = str.indexOf('revert ') + 'revert '.length;
    const endIndex = str.indexOf('",', startIndex);
    const revertReason = str.slice(startIndex, endIndex).replace(/\\n/g, '\n');
    return revertReason;
  }


  renderRoutes = () => {
    const {
      route, services, serviceRequests, account,
      loadingButton, routingOptions, error, currentServiceIdx
    } = this.state;

    switch (route) {
      case 'my-services':
        return (
          <Services
            services={services}
            error={error}
            account={account}
            approveService={this.approveService}
            loadingButton={loadingButton}
            currentServiceIdx={currentServiceIdx}
            hideModal={this.hideArticleModal}
            articleClickedHandler={this.articleClickedHandler}
          />
        );
      case 'my-requests':
        return (
          <ServiceRequests
            serviceRequests={serviceRequests}
            account={account}
            loadingButton={loadingButton}
            acceptServiceRequest={this.acceptServiceRequest}
            setRoute={this.setRoute}
            error={error}
          />
        );
      case 'post-request':
        return (
          <RequestServiceForm
            requestService={this.requestService}
            error={error}
          />
        );
      case 'submit-work':
        return (
          <SubmitWorkScreen
            routingOptions={routingOptions}
            submitWork={this.submitWork}
            error={error}
          />
        );

      case 'set-account-type':
      return (
        <SetAccountType
          setAccountType={this.setAccountType}
          error={error}
        />
      );
      default:
        return null;
    }
  }

  setRoute = (route, options = {}) => this.setState({ route, routingOptions: options, error: null });

  articleClickedHandler = idx => {
    this.setState({ currentServiceIdx: idx });
  }

  hideArticleModal = () => {
    this.setState({ currentServiceIdx: null });
  }

  render() {
    const { account, loading, fltTokenBalance, route, showingBuyFLTModal, etherTokenBalance, error, loadingButton } = this.state;

    if (loading) {
      return <Spinner />
    }

    return (
      <>
        <NavigationBar
          account={account}
          balance={window.web3.utils.fromWei(fltTokenBalance || '')}
          ETHBalance={Web3.utils.fromWei(etherTokenBalance || '')}
          setRoute={this.setRoute}
          route={route}
          buyFLT={this.buyFLT}
        />
        {this.renderRoutes()}
        {showingBuyFLTModal && (
          <BuyFLTScreen
            hideModal={this.hideModal}
            ETHBalance={Web3.utils.fromWei(etherTokenBalance)}
            purchaseFLT={this.purchaseFLT}
            loadingButton={loadingButton}
            error={error}
          />
        )}
        <Footer color="primary">
          © 2023. All Rights Reserved.
        </Footer>
      </>
    );
  }
}

export default App;

