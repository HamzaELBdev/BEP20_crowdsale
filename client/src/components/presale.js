import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import swal from 'sweetalert';
import Swal from 'sweetalert2'
import "bootstrap/dist/css/bootstrap.min.css"
import { getBalance, buyToken, getCrowdSaleContract } from './web3Utils';
import { CountdownTimer } from './CountdownTimer';
import "./CountDown.css"
import { TOKEN_ADDRESS, CROWD_SALE_ADDRESS } from './addresses';
import './presale.css'
import BnbLogo from '../images/tctlogo2.png'
import V2ELogo from '../images/bnblogo.png'

function usePresale() {

  const [allbnb, setAllbnb] = useState()
  const [connected, setConnection] = useState(false);
  const [bothConnections, setBothConnections] = useState(false);
  const [adresswallet, setAdressWallet] = useState('');
  const [balance, setBalance] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [rate, setRate] = useState(0);
  const [weiRaised, setWeiRaised] = useState(0);
  const [minbuy, setMinBuy] = useState(0)
  const [maxbuy, setMaxBuy] = useState(0)
  const [softcap, setSoftCap] = useState(0)
  const [hardcap, setHardCap] = useState(0)
  const [endpresale, setEndPresale] = useState(0)
  const [v2eBalance, setV2eBalance] = useState(0);
  const [presaleBalance, setPresaleBalance] = useState(0);
  const [mycontrubtion, setContrubtion] = useState(0)
  const [maxbnb, setMaxbnb] = useState(0);
  const itsNow = Date.now()/1000;
  const THREE_DAYS_IN_MS = (endpresale - itsNow) * 1000;
  const NOW_IN_MS = new Date().getTime();
  const dateTimeAfterThreeDays = NOW_IN_MS + THREE_DAYS_IN_MS;
  const connectToBscWallet = async () => {
    try {
      if (!window.BinanceChain) throw new Error('No MetaMask Wallet found');

      console.log('No MetaMask Wallet found')
      await window.BinanceChain.request({
        method: 'eth_accounts',
      });
      window.web3 = new Web3(window.BinanceChain);
      const chainId = await window.web3.eth.getChainId();
      if (chainId !== 56)
        throw new Error('Only Binance Smart Chain Testnet Allowed to Connect');

      swal(

        '',
        'Connected to Binance Wallet Successfully.',
        'success'
      );
      return setConnection(true);
    } catch (error) {
      return swal(
        'error',
        'ERROR_CONNECTING_BINANCE_WALLET',
        error.message ? error.message : 'Something Went Wrong.'
      );
    }
  };

  const connectToEthWallet = async () => {
    try {
      if (!window.ethereum) throw new Error(console.log('No MetaMask Wallet found'));
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      window.web3 = new Web3(window.ethereum);
      const chainId = await window.web3.eth.getChainId();
      if (chainId !== 56)
        throw new Error('Only Binance Smart Chain Allowed to Connect');

      return setConnection(true);
    } catch (error) {
      return swal(
        'ERROR_CONNECTING_BINANCE_WALLET',
        error.message ? error.message : 'Something Went Wrong.',
        'error'
      );
    }
  };

  const connect = async () => {
    try {
      if (window.ethereum && window.BinanceChain)
        return setBothConnections(true);

      if (window.ethereum) return connectToEthWallet();
      if (window.BinanceChain) return connectToBscWallet();

      return new Error('No Wallets Found');

    } catch (error) {
      return swal(
        'ERROR_CONNECTING',
        error.message ? error.message : 'Something went wrong.',
        'error'
      );
    }
  };


  const disConnect = async () => {
    window.web3 = new Web3();
    setConnection(false);
    setBothConnections(false);
  };

  const web3 = new Web3(window.web3);

  useEffect(() => {
    web3 && getBalances(web3);
  });

  const getBalances = async () => {
    const accountAddress = await web3.eth.getAccounts();
    const balance = await web3.eth.getBalance(accountAddress[0]);
    setBalance(web3.utils.fromWei(balance, 'ether'));
    setAdressWallet(accountAddress[0])
  };

  const submit = async () => {
    if (!connected) return console.log('Not Connected'), swal('Not Connected', 'Please Connect to Wallet', 'error');
    if (hardcap == weiRaised) return swal('FILLED', 'Second Presale Very SOON', 'info');
    if ( allbnb > ((hardcap - weiRaised)/10 ** 18)) return swal('$TCT', 'Only '+((((hardcap - weiRaised)* rate)/10 ** 18).toFixed(0))+' VE2 For Selling' , 'info');
    if (allbnb < (minbuy/10**18) || allbnb > (maxbuy/10**18) ) return swal('Not Enough BNB', 'Min ' +  (minbuy/10**18) + ' BNB and Max' +  (maxbuy/10**18) +' BNB' , 'info');
    if (!allbnb) return swal('Not Enough BNB', 'Please set you BNB amount to buy' , 'info');
    if ((Date.now()/1000) > endpresale) return swal('PRESALE FINISHED', '' , 'info');
    if (mycontrubtion > maxbuy) return swal('MAX CONTRUBTION REACHED FOR THIS WALLET', 'you can buy with: '+ ((maxbuy - mycontrubtion)/10**18).toFixed(2) + 'BNB' , 'info');


    // check if value exceeds balance
    const balance = await getBalance(window.web3);
    if (allbnb > balance) return console.log('Balance Amount Exceeded'), Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Balance Amount Exceeded',
    });

    setSubmitted(true);

    // send transaction
    const info = await buyToken(window.web3, allbnb);

    // clear values
    setAllbnb(0);
    setSubmitted(false);

    if (info.severity === 'success') {
      console.log(info.link);
    }
  };

  const contract = getCrowdSaleContract(web3);

  // get rate
  useEffect(() => {
    contract && getRate() && getWeiraised() && getEndPresale()   && getContrubtions() && getMinBuy() && getMaxBuy() && getHardCap() && getSoftCap() ;
  });

  const getRate = async () => {
    const rate = await contract.methods._rate.call().call();
    setRate(rate);
  };

  // get weiRased

  const getWeiraised = async () => {
    const raised = await contract.methods.weiRaised.call().call();
    setWeiRaised(raised);
  };
  

  // get Balance $TCT
  const minABI = require('./ABIs/MunziContractABI.json');
  useEffect(() => {
    web3 &&  getBalancev2e(web3) ;
  });

  const contractfcb = new web3.eth.Contract(minABI, TOKEN_ADDRESS);
  const getBalancev2e = async () => {
    const accountAddress = await web3.eth.getAccounts();
    const balanceV2e = await  contractfcb.methods.balanceOf(accountAddress[0]).call();
    setV2eBalance(balanceV2e)
  }


  //ClaimTokens
  const claimTokens = async () => {
    if((Date.now()/1000) > endpresale && mycontrubtion > 0){
    const accountAddress = await web3.eth.getAccounts();
    await contract.methods.claimTokens()
    .send({from: accountAddress[0]})
    .then((receipt) => {
      Swal.fire({
        icon: 'Success',
        title: '$TCT Tokens Claimed',
        text: receipt.message,
      })
      Refresh()
    })
    .catch((error) => {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message,
      })
    })}
    else{
      Swal.fire({
        icon: 'error',
        title: 'CLAIM NOT POSSIBLE',
      })
    }

  };

  //getContrubtion 
  const getContrubtions = async () => {
    const accountAddress = await web3.eth.getAccounts();
    const contrubtion = await contract.methods._contributions(accountAddress[0]).call()
    setContrubtion(contrubtion)
  };

  const getMinBuy = async () => {
    const minPurchase = await contract.methods.minPurchase().call()
    setMinBuy(minPurchase)
  };
  const getMaxBuy = async () => {
    const maxPurchase = await contract.methods.maxPurchase().call()
    setMaxBuy(maxPurchase)
  };
  const getSoftCap = async () => {
    const softCap = await contract.methods.softCap().call()
    setSoftCap(softCap)
  };
  const getHardCap = async () => {
    const hardCap = await contract.methods.hardCap().call()
    setHardCap(hardCap)
  };

  const getEndPresale = async () => {
    const endPresale = await contract.methods.endICO().call()
    setEndPresale(endPresale)
  };

   const Refresh =() =>{
    disConnect()
    connect()
   }
  return (
    <div className="container" >
      <div className="row">
        <div className={connected ? "col-md-6" :"offset-md-3  col-md-6"}>
          <div className="airdrop">
            <div className='wallet_data'>
              <div className='conref'><button className='connect-wallet' onClick={() => connected ? disConnect() : connect()}> {connected ? 'Disconnect Wallet' : 'Connect Wallet'}</button>{connected ? <i className="fas fa-redo" id="refresh" onClick={()=>Refresh()}></i>:null}</div>
              {connected ? <div className="presale-input"><p className="address">Address</p><input readOnly type="text" id="presale-address" placeholder="0x682ccC366E...c124788b8D8" value={adresswallet.slice(0, 10) + '.......' + adresswallet.slice(-10)} name="bnb" autoComplete="on" /> </div> : null}
              {connected ? <div className="presale-input"><p className="balance">Balance (BNB)</p><input readOnly type="text" id="presale-balance" placeholder="0.09 BNB" name="bnb" Value={balance} onChange={(e) => setMaxbnb(e.target.value)} autoComplete="on" /><button className='add-max' onClick={() => setAllbnb(balance)}>MAX</button> </div> : null}
              {connected ? <div className="presale-input"><p className="balance">Balance (TCT)</p><input readOnly type="text" id="presale-v2e" placeholder="0.09 BNB" name="bnb" Value={(v2eBalance*10**(-18)).toFixed(2)}  autoComplete="on" /> </div> : null}
            </div>

            <div className="presale_form_area">

              <div className="presale-input"><p className="bnb">BNB</p><input type="number" min="0.01" step="0.01" onChange={(e) => setAllbnb(e.target.value)} value={allbnb} id="add-bnb" placeholder="0.01" name="bnb" autoComplete="on" /><p className="bnb-logo"><img src={BnbLogo}></img></p> </div>

              <div className='swap_logo'><i className="fas fa-exchange fa-rotate-90"></i></div>

              <div className="presale-input"><p className="v2e">$TCT</p><input type="number" id="get-v2e" placeholder="100000000" value={allbnb * rate} name="v2e" autoComplete="on" /><p className="v2e-logo"><img src={V2ELogo}></img></p> </div>
              <div><button type="submit" style={{ marginTop: "35px" }} onClick={() => submit()} className="presale-done">
                {submitted ? <p  className='waiting'  style={{marginBottom: "0px"}}>Waiting <div class="loader">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div></p> : 'Presale'} </button></div>
              <div className="fa-3x">
              </div>

            </div>

          </div>
        </div>
        {connected ? <div className="col-md-6" >
          <div className="airdrop">
            <div className='wallet_data'>
              {(Date.now()/1000) > endpresale ? <p className='prensale_ends'>Claiming Open</p> : <CountdownTimer id="end" targetDate={dateTimeAfterThreeDays} /> }
            </div>
            <div className="presale_form_area">
            <div className='inprogress_tag'><p>inProgress</p></div>
              <div className="progress">
                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: (((weiRaised / hardcap) * 100)) + "%" }} ></div>
              </div>
              <div className='sof_cap' style={{ width:"70px" ,marginLeft: "10%", position: "relative", left: (((weiRaised / hardcap) * 80)) + "%" }}>
                <div className="soft_cap_line"></div>
                <p className="soft_cap_text">Raised <br></br> {(weiRaised / 10 ** 18).toFixed(3)} BNB</p>
              </div>
              <div className='allrates'>
              <div className='rate'>
                <div className='rate_tag'><p>CAP</p></div>
                <div className='rate_detail'>{connected ? <div className='rate'><p>SOFT CAP = {softcap/10**18} BNB</p>
                <p>HARD CAP = {hardcap/10**18} BNB</p></div> : null}</div>
            </div>
              <div className='rate'>
                <div className='rate_tag'><p>RATE</p></div>
                <div className='rate_detail'>{connected ? <div className='rate'><p>1 BNB = {rate} $TCT</p>
                <p>1 $TCT = {(1 / rate) || null} BNB</p></div> : null}</div>
            </div>

            <div className='rate'>
                <div className='rate_tag'><p>BUY</p></div>
                <div className='rate_detail'>{connected ? <div className='rate'><p>MIN BUY = {minbuy/10**18} BNB</p>
                <p>MAX BUY = {maxbuy/10**18} BNB</p></div> : null}</div>
            </div>
            </div>
            <div className='contrubtion'>
              <div className='bnb_cont'><p>Your Contrubtion: {mycontrubtion/10**18} BNB</p></div>
              <div className='bnb_cont'><p>Tokens to claim: {(mycontrubtion*rate)/10**18} $TCT</p></div>
              <button className='claim_button'  onClick={()=>claimTokens()}>CLAIM</button>
           
            </div>
          </div>
          </div>
        </div> : null}
      </div>
    </div>
  )
}
export default usePresale;

