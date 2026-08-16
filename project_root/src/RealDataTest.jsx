import React from 'react';
import axios from 'axios';
import Slideshow from './Slideshow';

// Replicates App's REAL data-fetching pipeline exactly (same axios
// instance config, same getList/getAccessKey logic, same env vars,
// same Slideshow props) but with everything else about App.jsx
// stripped away - no "help" branch, no RingLoader, no nested
// div/ternary tree, no document.body side effect.
//
// If THIS reproduces the hang -> the bug is in the real data or the
// real Slideshow integration itself.
// If THIS works fine -> the bug is somewhere in App.jsx's surrounding
// code that we haven't suspected yet, and we add pieces of App.jsx
// back in one at a time from here until it breaks.
class RealDataTest extends React.Component {
  constructor(props) {
    super(props);

    const base_url = import.meta.env.VITE_BASE_URL;
    const picasa_api_key = import.meta.env.VITE_PICASA_API_KEY;

    const axiosInstance = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'X-Slideshow-Key': picasa_api_key,
      },
    });

    this.state = {
      base_url,
      axiosInstance,
      param_url: base_url + 'api/parameters/',
      list_url: base_url + 'api/image_list/',
      status: 'idle',
      image_ids: null,
      img_access_key: null,
    };
  }

  componentDidMount() {
    this.setState({ status: 'fetching list...' });
    this.state.axiosInstance
      .get(this.state.list_url)
      .then((response) => {
        const image_ids = response.data['url_keys'];
        console.log('[RealDataTest] got image_ids, length:', image_ids.length);
        this.setState({ status: 'fetching access key...' });
        return this.state.axiosInstance.get(this.state.param_url).then((paramResponse) => {
          const img_access_key = paramResponse.data['random_access_key'];
          console.log('[RealDataTest] got img_access_key:', img_access_key);
          this.setState({ image_ids, img_access_key, status: 'ready' }, () => {
            console.log('[RealDataTest] setState commit callback FIRED. status:', this.state.status);
          });
        });
      })
      .catch((err) => {
        console.error('[RealDataTest] error:', err);
        this.setState({ status: 'error: ' + err.message });
      });
  }

  render() {
    const { status, image_ids, img_access_key, base_url } = this.state;
    return (
      <div style={{ background: '#111', minHeight: '100vh', color: 'white', padding: 20 }}>
        <h1>Real Data Test</h1>
        <p>Status: {status}</p>
        {status === 'ready' ? (
          <Slideshow image_ids={image_ids} img_access_key={img_access_key} base_url={base_url} slide_len={6} />
        ) : (
          <p>Waiting...</p>
        )}
      </div>
    );
  }
}

export default RealDataTest;