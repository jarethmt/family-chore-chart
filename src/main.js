import { createApp } from 'vue'
import App from './App.vue'
import './styles/base.css'
import './themes/themes.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { CHORE_ICONS, UI_ICONS } from './lib/icons.js'

library.add(...CHORE_ICONS.map((i) => i.def), ...UI_ICONS)

createApp(App).component('fa', FontAwesomeIcon).mount('#app')
