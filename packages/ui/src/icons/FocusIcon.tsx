import { FC } from "react";

import { Icon, IconProps } from "./Icon.js";

// copied from material design icons
export const FocusIcon: FC<IconProps> = (props) => (
  <Icon {...props} viewBox="0 -960 960 960">
    <path d="M180-120q-24 0-42-18t-18-42v-172h60v172h172v60H180Zm428 0v-60h172v-172h60v172q0 24-18 42t-42 18H608ZM480-376q-45 0-74.5-29.5T376-480q0-45 29.5-74.5T480-584q45 0 74.5 29.5T584-480q0 45-29.5 74.5T480-376Zm0-60q18 0 31-13t13-31q0-18-13-31t-31-13q-18 0-31 13t-13 31q0 18 13 31t31 13ZM120-608v-172q0-24 18-42t42-18h172v60H180v172h-60Zm660 0v-172H608v-60h172q24 0 42 18t18 42v172h-60Z" />
  </Icon>
);
