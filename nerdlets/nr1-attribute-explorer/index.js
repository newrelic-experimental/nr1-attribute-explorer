import React from 'react';
import { NerdletStateContext, EntityByGuidQuery, Spinner, StackItem, SectionMessage } from 'nr1';
import AttributeExplorer from './attribute-explorer';

/*
  Main parent class, checks for an entity guid and calls the main class (AttributeExplorer).
  If no entity guid is found then asks the user to launch the app from within an APM or OTEL service.
*/
export default class Nr1AttributeExplorerNerdlet extends React.Component {
  constructor(props) {
    super(props);
  }

  // Method to get and return the entity guid from the nerdlet state.
  getEntityGuid(nerd) {
    if (nerd.hasOwnProperty('entityGuid')) {
      console.log(nerd);
      return nerd.entityGuid;
    }
    else {
      return null;
    }
  }

  // Renders a spinner while getting the nerdlet state. Once we have the state
  // returns an error, info message or main worker class (AttributeExplorer).
  render() {
    return (
      <NerdletStateContext.Consumer>
        {(nerdletState) => 
          <EntityByGuidQuery entityGuid={this.getEntityGuid(nerdletState)}>
            {({ loading, error, data }) => {
              if (loading) {
                return <Spinner />;
              }

              if (error) {
                return (
                  <StackItem>
                    <SectionMessage
                     type={SectionMessage.TYPE.CRITICAL}
                     title="Error in lauching the app."
                      description={error.message}
                    />
                 </StackItem>
                );
              }

              if (data.entities.length === 0) {
                return (
                  <StackItem>
                    <SectionMessage
                      description="No service found, please launch the app from within an APM or OTEL service."
                    />
                  </StackItem>
                );
              }

              return (
                <AttributeExplorer
                  entityGuid={this.getEntityGuid(nerdletState)}
                  entityName={data.entities[0].name}
                  accountId={data.entities[0].accountId}
                  domain={data.entities[0].domain}
                  type={data.entities[0].type}
                />
              );
            }}
          </EntityByGuidQuery>
        }
      </NerdletStateContext.Consumer>
    );
  }  
}
