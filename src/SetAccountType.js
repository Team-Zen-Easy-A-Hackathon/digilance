import React from 'react'
import { Button } from 'react-bulma-components';

export default function SetAccountType({ setAccountType}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '400px'}}>
        <Button
            color="info"
            onClick={() => setAccountType('client')}
						style={{ marginLeft: '20px'}}
						size='large'
        >
            Client
        </Button>
				<Button
            color="info"
            onClick={() => setAccountType('freelancer')}
						style={{ marginLeft: '20px'}}
						size='large'
        >
            Freelancer
        </Button>
				<Button
            color="info"
            onClick={() => setAccountType('reviewer')}
						style={{ marginLeft: '20px'}}
						size='large'
        >
            Reviewer
        </Button>
    </div>
  )
}
