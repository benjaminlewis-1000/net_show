import React from 'react';

// try/catch around a setState call can only catch errors in the
// synchronous code calling setState - it CANNOT catch errors thrown
// later, during React's own render/commit pass for whatever that
// state update causes to render (e.g. if Slideshow or Swiper itself
// throws while mounting). This component is React's actual mechanism
// for catching that class of error, so it stops failing silently.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught a render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'red', background: '#200', padding: 20, fontFamily: 'monospace' }}>
          <h2>Render error caught:</h2>
          <pre>{String(this.state.error && this.state.error.stack ? this.state.error.stack : this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;