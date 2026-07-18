var CASCADE_LEVELS = [
  { key: "northStar",  label: "North Star",            icon: "star",     color: "blue",   isCardGrid: true },
  { key: "sixMonth",   label: "6-Month Checkpoints",   icon: "calendar",  color: "amber",  isCardGrid: false },
  { key: "threeMonth", label: "3-Month Checkpoints",   icon: "target",    color: "green",  isCardGrid: false },
  { key: "oneMonth",   label: "1-Month Checkpoints",   icon: "flag",   color: "purple", isCardGrid: false },
];

var LEVEL_COLORS = { northStar: "blue", sixMonth: "amber", threeMonth: "green", oneMonth: "purple" };

var GOAL_LEVELS = [
  { key: "sixMonth", label: "6-Month" },
  { key: "threeMonth", label: "3-Month" },
  { key: "oneMonth", label: "1-Month" },
];

var CHECKPOINT_CONFIRM_TEXT = "yea boi";
var WIPE_CONFIRM_TEXT = "delete all data";

var DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var MONTH_ABBREVS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var MOOD_LABELS = { 5: "Great", 4: "Good", 3: "Okay", 2: "Rough", 1: "Tough" };

var TAB_NAMES = ["today", "review", "constitution", "career", "settings"];

function generateId(prefix) {
  return `${prefix}_${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}
