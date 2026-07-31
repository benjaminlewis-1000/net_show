import React from 'react';
import './App.css';
import store from 'store';
import axios from 'axios';
// import './params.js';
// import CrossfadeImage from "./crossfade";
// import CircleLoader from "react-spinners/CircleLoader";
import RingLoader from "react-spinners/RingLoader";
import Switcher from "./switcher"

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

    const base_url = process.env.REACT_APP_BASE_URL; //store.get('base_url')
    const picasa_api_key = process.env.REACT_APP_PICASA_API_KEY; // || "6w808pb9Wsg3DiM";

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
      list_url: base_url + "api/image_list/" + search,
      base_url: base_url,
      loading: true,
      axiosInstance: axiosInstance,
      slide_len: slide_len,
      help: help,
      shuffle: params.get('cronological') === null
    };

    this.changeImage = this.changeImage.bind(this);

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

  getAccessKey = async() => {

    const a = new Promise((resolve, reject) => {
      this.state.axiosInstance.get(this.state.param_url)
      .then( (response) => {
        // this.state.img_access_key = response.data['random_access_key']
        this.setState({img_access_key: response.data['random_access_key'] })
        // console.log(this.state.img_access_key)
        return resolve();
      }, (param_error) => {
        console.log(param_error)
      }).catch(err => {
          console.log(err)
      });

    });

    return await a;
  }

  getList = async() => {

    const a = new Promise((resolve, reject) => {

      this.state.axiosInstance.get(this.state.list_url)
      .then( (response) => {
        // this.state.image_ids =  response.data['url_keys']
        console.log(response)
        var image_ids = response.data['url_keys']
        console.log(image_ids.length)
        if (this.state.shuffle){
          shuffle(image_ids)  
        }
        this.setState({image_ids: image_ids})
        return resolve();
      }, (imlist_error) => {
        console.log(imlist_error)
      }).catch(err => {
          console.log(err)
      });

    });

    return await a;
  }


   componentDidMount() {
      // this.getURLs() //.then( ()=> {console.log("hi")})

      // document.body.style.backgroundColor = "#e4ede6";
      // this.login().then( () => {
      this.getList().then(  () => {
        this.getAccessKey().then( () => {
          console.log("Access key is: " + this.state.img_access_key)
          var first_img = this.state.base_url + 'api/keyed_image/slideshow/?id=' + this.state.image_ids[0] + '&access_key=' + this.state.img_access_key
          this.setState({image_url: first_img})
          this.setState({imageIndex: 0})
          this.setState({loading: false})
          // document.body.style.backgroundColor = "gray";
          if (! this.state.help ){
            document.body.style.backgroundColor = "black";
          }
        })
      })
      // })

   }

  changeImage() {
    if (this.state.imageIndex === this.state.image_ids.length - 1) {
      var newIdx = 0
    } else {
      newIdx = this.state.imageIndex + 1;
    }
    var new_img = this.state.base_url + 'api/keyed_image/slideshow/?id=' + this.state.image_ids[newIdx] + '&access_key=' + this.state.img_access_key
    this.setState({image_url: new_img})
    this.setState({ imageIndex: newIdx });
  }

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
                  <Switcher 
                    source={this.state.image_url}
                    image_ids={this.state.image_ids}
                    img_access_key={this.state.img_access_key}
                    base_url={this.state.base_url}
                    slide_len={this.state.slide_len}
                  />
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
