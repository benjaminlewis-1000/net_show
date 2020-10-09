// Image component
import React from 'react';
import './image.css';


// PureComponent includes a shallow shouldComponentUpdate method. 
class Image extends React.Component {
  
  render() {
    
    return (
      <div>
        <img className={this.props.hidden? 'hidden' : 'visible'} src={this.props.url} alt="" />
      </div>
    );
  }
}

export default Image;