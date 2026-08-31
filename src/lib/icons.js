// Curated, kid-friendly Font Awesome (free solid) icon set for chores, plus the
// UI icons the app chrome needs. Kept as an explicit allow-list so the picker stays
// tidy and the bundle stays small.

import {
  faTooth, faBed, faShirt, faShower, faSoap, faToilet, faBrush,
  faBookOpen, faPencil, faGraduationCap, faBagShopping,
  faBowlFood, faAppleWhole, faCarrot, faGlassWater, faMugHot, faUtensils,
  faDog, faCat, faFish, faSeedling, faTree,
  faBroom, faTrash, faShoePrints, faSocks, faBoxArchive, faBucket,
  faGamepad, faPuzzlePiece, faGuitar, faMusic, faPalette, faFutbol,
  faStar, faHeart, faMoon, faSun, faCloudSun, faSmile,
  faHandsWash, faHandSparkles, faSprayCanSparkles, faWind,
  faClock, faCalendarCheck, faCheck, faListCheck, faDumbbell,
  // UI
  faPlus, faXmark, faPen, faTrashCan, faGear, faArrowLeft, faArrowRight,
  faChevronUp, faChevronDown, faQrcode, faCopy, faRotate, faLock, faUnlock,
  faCamera, faHouse, faUsers, faChild, faGift, faCircleCheck, faCircleXmark,
  faShareNodes, faCircleInfo, faTriangleExclamation, faWifi, faPaw, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons'

// Chore icons — each is { name, label, def }. `name` is the stable id we store on a
// chore; `def` is the imported FA definition registered into the library.
export const CHORE_ICONS = [
  { name: 'tooth', label: 'Brush teeth', def: faTooth },
  { name: 'bed', label: 'Make the bed', def: faBed },
  { name: 'shirt', label: 'Get dressed', def: faShirt },
  { name: 'shower', label: 'Take a shower', def: faShower },
  { name: 'soap', label: 'Wash up', def: faSoap },
  { name: 'toilet', label: 'Potty', def: faToilet },
  { name: 'brush', label: 'Brush hair', def: faBrush },
  { name: 'hands-wash', label: 'Wash hands', def: faHandsWash },
  { name: 'hand-sparkles', label: 'Clean hands', def: faHandSparkles },
  { name: 'book-open', label: 'Read a book', def: faBookOpen },
  { name: 'pencil', label: 'Homework', def: faPencil },
  { name: 'graduation-cap', label: 'School', def: faGraduationCap },
  { name: 'backpack', label: 'Pack backpack', def: faBagShopping },
  { name: 'bowl-food', label: 'Eat breakfast', def: faBowlFood },
  { name: 'apple-whole', label: 'Eat a snack', def: faAppleWhole },
  { name: 'carrot', label: 'Eat veggies', def: faCarrot },
  { name: 'glass-water', label: 'Drink water', def: faGlassWater },
  { name: 'mug-hot', label: 'Warm drink', def: faMugHot },
  { name: 'utensils', label: 'Clear the table', def: faUtensils },
  { name: 'dog', label: 'Feed the dog', def: faDog },
  { name: 'cat', label: 'Feed the cat', def: faCat },
  { name: 'fish', label: 'Feed the fish', def: faFish },
  { name: 'seedling', label: 'Water plants', def: faSeedling },
  { name: 'tree', label: 'Yard work', def: faTree },
  { name: 'broom', label: 'Sweep', def: faBroom },
  { name: 'trash', label: 'Take out trash', def: faTrash },
  { name: 'shoe-prints', label: 'Put shoes away', def: faShoePrints },
  { name: 'socks', label: 'Put socks away', def: faSocks },
  { name: 'box-archive', label: 'Tidy toys', def: faBoxArchive },
  { name: 'bucket', label: 'Clean up', def: faBucket },
  { name: 'spray-sparkles', label: 'Wipe surfaces', def: faSprayCanSparkles },
  { name: 'wind', label: 'Air out room', def: faWind },
  { name: 'gamepad', label: 'Game time', def: faGamepad },
  { name: 'puzzle-piece', label: 'Puzzle', def: faPuzzlePiece },
  { name: 'guitar', label: 'Practice music', def: faGuitar },
  { name: 'music', label: 'Music', def: faMusic },
  { name: 'palette', label: 'Art time', def: faPalette },
  { name: 'futbol', label: 'Play outside', def: faFutbol },
  { name: 'dumbbell', label: 'Exercise', def: faDumbbell },
  { name: 'list-check', label: 'Chores', def: faListCheck },
  { name: 'calendar-check', label: 'Daily task', def: faCalendarCheck },
  { name: 'star', label: 'Star task', def: faStar },
  { name: 'heart', label: 'Be kind', def: faHeart },
  { name: 'moon', label: 'Bedtime', def: faMoon },
  { name: 'sun', label: 'Morning', def: faSun },
  { name: 'smile', label: 'Good job', def: faSmile }
]

export const ICON_BY_NAME = Object.fromEntries(CHORE_ICONS.map((i) => [i.name, i]))

export function iconDefName(name) {
  const found = ICON_BY_NAME[name]
  return found ? found.def.iconName : 'list-check'
}

export const UI_ICONS = [
  faPlus, faXmark, faPen, faTrashCan, faGear, faArrowLeft, faArrowRight,
  faChevronUp, faChevronDown, faQrcode, faCopy, faRotate, faLock, faUnlock,
  faCamera, faHouse, faUsers, faChild, faGift, faCircleCheck, faCircleXmark,
  faShareNodes, faCircleInfo, faTriangleExclamation, faWifi, faPaw, faStar,
  faMoon, faSun, faCloudSun, faCheck, faClock, faListCheck, faEye, faEyeSlash
]
