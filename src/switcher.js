import React from 'react';
import './image.css';


class Switcher extends React.Component {
  constructor(props) {
    super(props);
    var idx_tik = 0;
    var idx_tok = 0
    const base_url = props.base_url + 'api/keyed_image/slideshow/?id='
    if (props.image_ids.length > 1){
      idx_tok = 1;
    }

    const url_tik = base_url  + props.image_ids[0] + '&access_key=' + props.img_access_key 
    const url_tok = base_url  + props.image_ids[idx_tok] + '&access_key=' + props.img_access_key 
    const duration_css = {"animationDuration": props.slide_len * 2 + "s"}

    this.state = {
      idx_tik: idx_tik,
      url_tik: url_tik,
      idx_tok: idx_tok,
      url_tok: url_tok,
      index: idx_tok,
      move: false,
      image_ids: props.image_ids,
      img_access_key: props.img_access_key,
      base_url: base_url,
      tiktok : false,
      slide_len: props.slide_len,
      css: duration_css
    };
    
    this.construct_url = this.construct_url.bind(this)
  }

  getNextIndex(idx) {
    if (idx >= this.state.image_ids.length - 1) {
      return 0;
    }
    return idx + 1;
  }

  construct_url(idx){
    const url = this.state.base_url + this.props.image_ids[idx] + '&access_key=' + this.state.img_access_key
    return url
  }

  tick() {

    var next_idx = this.getNextIndex(this.state.index)
    this.setState({index: next_idx})
    const next_url = this.construct_url(next_idx)
    if (this.state.tiktok) {
      this.setState({idx_tik: next_idx })
      this.setState({url_tik: next_url })
    }
    else{
      this.setState({idx_tok: next_idx })
      this.setState({url_tok: next_url })
    }
    this.setState({tiktok : !this.state.tiktok})
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), this.state.slide_len * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div className="mask">
        <div className="pic-wrapper">         
         <img className={this.state.tiktok? 'hidden' : 'visible'} src={this.state.url_tik} alt="" style={this.state.css}/>          
         <img className={!this.state.tiktok? 'hidden' : 'visible'} src={this.state.url_tok} alt="" style={this.state.css}/>
        </div>
      </div>
    );
  }
}

export default Switcher;
