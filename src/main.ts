import './index.pug';
import './index.scss';

import Slider from './components/slider/slider';
new Slider(document.getElementById('slider-1'), {
    startIndex: 2,
    speed: 400,
    isAutoHeight: false,
    isRewind: true,
    isAutoplay: false,
});
import './pages/test-animate/index';
import './components/js-animation/index';