import './index.pug';
import './index.scss';

import Slider from './components/slider/slider';
new Slider(document.getElementById('slider-1'), {
    startIndex: 2,
    speed: 400,
    isAutoHeight: false,
    isRewind: false,
    isAutoplay: false,
    hasDots: true,
    countSwipe: 1,
    visibleItems: 4
});
new Slider(document.getElementById('slider-2'), {
    startIndex: 2,
    speed: 400,
    isAutoHeight: false,
    isRewind: false,
    isAutoplay: true,
    hasDots: true,
    countSwipe: 1,
    isLoop: true,
});
import './pages/test-animate/index';
import './components/js-animation/index';
