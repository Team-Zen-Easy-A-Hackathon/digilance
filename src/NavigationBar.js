import React, { Component } from 'react';
import { Navbar, Button } from "react-bulma-components";

import { formatAddress } from './shared';

const { Menu, Item, Container, Brand } = Navbar;

class NavigationBar extends Component {

  render() {
    const { account, balance, setRoute, route, buyFLT, ETHBalance } = this.props;
    return (
      <Navbar color="primary">
        <Brand style={{ fontSize: '20px', fontWeight: 'bold' }}>
          <Item
            onClick={() => setRoute('my-services')}
            active={route === 'my-services'}
          >
            My Services
          </Item>
        </Brand>
        <Menu>
          <Container>
            <Item
              onClick={() => setRoute('my-requests')}
              active={route === 'my-requests'}>
              Service Requests
            </Item>
            <Item
              onClick={() => setRoute('post-request')}
              active={route === 'post-request'}
            >
              Request Service
            </Item>
            <Item 
              onClick={() => setRoute('submit-work')}
              active={route === 'submit-work'}
            >
              Submit Work
            </Item>
          </Container>
          <Container align="end" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold'}}>
          <Button color="info" style={{ fontWeight: 'bold' }} className="buy-flt" onClick={buyFLT}>
              Buy FLT
            </Button>
            <Item style={{ color: 'white' }} renderAs="div">
              {`${balance} FLT`}
            </Item>
            <Item style={{ color: 'white' }} renderAs="div">
              {`${ETHBalance} ETH`}
            </Item>
            <Item style={{ color: 'white' }} renderAs="div">
              {formatAddress(account)}
            </Item>
          </Container>
        </Menu>
      </Navbar>
    );
  }
}

export default NavigationBar;