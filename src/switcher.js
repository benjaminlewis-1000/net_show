import React from 'react';
import './image.css';

class Switcher extends React.Component {
  constructor(props) {
    super(props);

    const baseUrl = `${props.base_url}api/keyed_image/slideshow/?id=`;
    const initialTokIdx = props.image_ids.length > 1 ? 1 : 0;

    this.state = {
      idx_tik: 0,
      url_tik: this.buildUrl(baseUrl, props.image_ids[0], props.img_access_key),
      idx_tok: initialTokIdx,
      url_tok: this.buildUrl(baseUrl, props.image_ids[initialTokIdx], props.img_access_key),
      currentIndex: initialTokIdx,
      tiktok: false,
    };
  }

  buildUrl(baseUrl, id, accessKey) {
    if (!id) return '';
    return `${baseUrl}${id}&access_key=${accessKey}`;
  }

  getNextIndex(idx) {
    const { image_ids } = this.props;
    if (!image_ids || image_ids.length <= 1) return 0;
    return (idx + 1) % image_ids.length;
  }

  // Navigate to previous image (blocked at index 0)
  handlePrev = () => {
    this.setState((prevState) => {
      if (prevState.currentIndex > 0) {
        return { currentIndex: prevState.currentIndex - 1 };
      }
      return null; // Don't state-update if at the beginning
    });
  };

  // Navigate to next image (blocked at the end of the list)
  handleNext = () => {
    this.setState((prevState) => {
      if (prevState.currentIndex < this.state.image_ids.length - 1) {
        return { currentIndex: prevState.currentIndex + 1 };
      }
      return null; // Don't state-update if at the end
    });
  };

  tick() {
    const { image_ids, base_url, img_access_key } = this.props;
    const baseUrl = `${base_url}api/keyed_image/slideshow/?id=`;

    const nextIdx = this.getNextIndex(this.state.currentIndex);
    const nextUrl = this.buildUrl(baseUrl, image_ids[nextIdx], img_access_key);

    // Consolidate into a single state update to avoid async state issues
    if (this.state.tiktok) {
      // Currently showing 'tik', so update 'tok' for the next transition
      this.setState({
        idx_tok: nextIdx,
        url_tok: nextUrl,
        currentIndex: nextIdx,
        tiktok: false,
      });
    } else {
      // Currently showing 'tok', so update 'tik' for the next transition
      this.setState({
        idx_tik: nextIdx,
        url_tik: nextUrl,
        currentIndex: nextIdx,
        tiktok: true,
      });
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
    if (this.props.image_ids && this.props.image_ids.length > 0) {
      this.interval = setInterval(() => this.tick(), this.props.slide_len * 1000);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    clearInterval(this.interval);
  }

  handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      this.handlePrev();
    } else if (event.key === 'ArrowRight') {
      this.handleNext();
    }
  };

  render() {
    const durationCss = { animationDuration: `${this.props.slide_len * 2}s` };

    return (
      <div className="mask">
        <div className="pic-wrapper">
          <img
            className={this.state.tiktok ? 'visible' : 'hidden'}
            src={this.state.url_tik}
            alt=""
            style={durationCss}
            // onLoad={() => console.log('✅ Loaded Tik:', this.state.url_tik)}
            onError={(e) => {
              console.error('❌ Failed to load Tik URL:', this.state.url_tik);
              // alert(`Failed to load image: ${this.state.url_tik}`);
           }}
          />
          <img
            className={this.state.tiktok ? 'hidden' : 'visible'}
            src={this.state.url_tok}
            alt=""
            style={durationCss}
	    // onLoad={() => console.log('✅ Loaded Tok:', this.state.url_tok)}
	    onError={(e) => {
	      console.error('❌ Failed to load Tok URL:', this.state.url_tok);
	      // alert(`Failed to load image: ${this.state.url_tok}`);
  	   }}
          />
        </div>
      </div>
    );
  }
}

export default Switcher;
