import React from 'react';
import './App.css';
// import store from 'store';
import axios from 'axios';
// import './params.js';
// import CrossfadeImage from "./crossfade";
// import CircleLoader from "react-spinners/CircleLoader";
import { RingLoader } from "react-spinners";
import Slideshow from "./Slideshow"
import ErrorBoundary from "./ErrorBoundary"

// store.set('base_url', 'https://picasa.exploretheworld.tech/');


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

class App extends React.Component {
  constructor(props) {
    super(props);
    // console.log(headers)
    let search = window.location.search;
    // console.dir(window);
    // console.log(search)
    let params = new URLSearchParams(search);
    var slide_len = params.get('slide_len');
    if (slide_len === null){
      slide_len = 6;
    }

    if (params.get('help') === null){
      var help=false;
    }else{
      help=true;
    }

    // Debug helper: ?debug_limit=N truncates the fetched image list to
    // N entries client-side, for testing end-of-list/looping behavior
    // without needing a real backend filter that happens to return a
    // small set. Frontend-only, like slide_len/help - stripped from
    // the backend query below the same way.
    var debug_limit = params.get('debug_limit');
    debug_limit = debug_limit === null ? null : parseInt(debug_limit, 10);

    // slide_len, help, and debug_limit are frontend-only settings -
    // the backend was never meant to see them, and errors (500) if
    // slide_len shows up as the only param in the query string with
    // nothing else to work with. Build a SEPARATE query string for
    // the backend that strips these out, keeping only params it
    // actually understands (people, year_start, year_end,
    // cronological, etc.) - the params object above is untouched.
    const backendParams = new URLSearchParams(search);
    backendParams.delete('slide_len');
    backendParams.delete('help');
    backendParams.delete('debug_limit');
    const backendSearch = backendParams.toString() ? '?' + backendParams.toString() : '';

    const base_url = import.meta.env.VITE_BASE_URL; //store.get('base_url')
    const picasa_api_key = import.meta.env.VITE_PICASA_API_KEY; // || "6w808pb9Wsg3DiM";

    const axiosInstance = axios.create({
        // baseURL: api_url,
        timeout: 60000,
        headers: {
            // 'Authorization': 'TBD',
            'Content-Type': 'application/json',
            'accept': 'application/json',
            'X-Slideshow-Key': picasa_api_key,
        }
    });

    this.state = {
      // token_url: base_url + 'api/token/obtain/',
      param_url: base_url + "api/parameters",
      list_url: base_url + "api/image_list/" + backendSearch,
      base_url: base_url,
      loading: true,
      axiosInstance: axiosInstance,
      slide_len: slide_len,
      help: help,
      debug_limit: debug_limit,
      shuffle: params.get('cronological') === null
    };

  //   this.changeImage = this.changeImage.bind(this);

  }

  // login = async () => {

  //   const login_token = new Promise((resolve, reject) => {
  //     setTimeout(() => 
  //       { 
           
  //         this.state.axiosInstance.post(this.state.token_url, {})
  //         .then(response => {
  //           store.set('access_token',  'JWT ' + response.data.access.replace(/['"]+/g, '') )

  //           // this.setState({username: 'removed' })
  //           // this.setState({password: 'removed' })
  //           return resolve();
  //           }
  //         )
  //         .catch((error) =>{
  //           console.error("Caught an error:", error.message, "This error happened because the hard-coded username and/or password is incorrect.");
  //         })
  //       }
  //     , 1000)
  //    });

  //   return login_token

    
  // }

  getAccessKey = async () => {
    try {
      const response = await this.state.axiosInstance.get(this.state.param_url);
      const key = response.data['random_access_key'];
      // Resolve with the key value itself, rather than relying on a
      // later read of this.state.img_access_key. Under React 18,
      // setState calls made inside promise callbacks are batched and
      // applied asynchronously - so reading this.state right back
      // afterward (even in a later .then()) isn't guaranteed to see
      // this update yet. (In React 16/17 setState outside a React
      // event handler applied synchronously, which is why the old
      // "setState then immediately read this.state" pattern worked.)
      this.setState({ img_access_key: key });
      return key;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  };

  getList = async () => {
    try {
      const response = await this.state.axiosInstance.get(this.state.list_url);
      var image_ids = response.data['url_keys'];
      console.log(image_ids.length);
      if (this.state.shuffle) {
        shuffle(image_ids);
      }
      if (this.state.debug_limit && this.state.debug_limit > 0) {
        image_ids = image_ids.slice(0, this.state.debug_limit);
        console.log(`[App] debug_limit active: truncated to ${image_ids.length} images`);
      }
      this.setState({ image_ids: image_ids });
      // Same fix as getAccessKey() above - resolve with the array
      // directly instead of trusting a later this.state.image_ids read.
      return image_ids;
    } catch (err) {
      console.log(err);
      return [];
    }
  };


   componentDidMount() {
      Promise.all([this.getList(), this.getAccessKey()])
        .then(([image_ids, img_access_key]) => {
          var first_img = this.state.base_url + 'api/keyed_image/slideshow/?id=' + image_ids[0] + '&access_key=' + img_access_key
          if (! this.state.help ){
            document.body.style.backgroundColor = "black";
          }
          this.setState({ image_url: first_img, imageIndex: 0, loading: false });
        })
        .catch((err) => {
          console.error('[App] failed to load slideshow data:', err);
        });
   }

//  changeImage() {
//    if (this.state.imageIndex === this.state.image_ids.length - 1) {
//      var newIdx = 0
//    } else {
//      newIdx = this.state.imageIndex + 1;
//    }
//    var new_img = this.state.base_url + 'api/keyed_image/slideshow/?id=' + this.state.image_ids[newIdx] + '&access_key=' + this.state.img_access_key
//    console.log("New URL: " + new_img)
//    this.setState({image_url: new_img})
//    this.setState({ imageIndex: newIdx });
//  }

  render(){

    return (
          <div>
            {this.state.help ? (
              <div className="loader">
              <p>Hey there! You are looking for help. </p>
              <p>A few commands. You can pass URL parameters (after /?) with the following: </p>
              <p>people=&lt;a comma-separated list of people&gt;</p>
              <p>slide_len=&lt;length of each slide in seconds&gt;</p>
              <p>help -- this page</p>
              <p>year_start=&lt;year&gt; and/or year_end=&lt;year&gt;</p>
              <p>No arguments -- Slideshow of all photos</p>
              <p>cronological -- Photos stay in chronological order</p>
              </div>
            ) : (

            <div >
              {this.state.loading ? (
                <div className="loader">
                  <RingLoader
                    size={500}
                    color={"#9df2f2"}
                    loading={this.state.loading}
                    speedMultiplier={0.2}
                  />
                </div>
              ) : (
                <div >
                  <ErrorBoundary>
                    <Slideshow
                      image_ids={this.state.image_ids}
                      img_access_key={this.state.img_access_key}
                      base_url={this.state.base_url}
                      slide_len={this.state.slide_len}
                    />
                  </ErrorBoundary>
                </div>
              )}
              </div>

            )}
          </div>

          
      // )}
    );
  }
}

export default App;