import { FC } from "react";
import { Icon, IconProps } from "./Icon";

export const CompassIcon: FC<IconProps> = (props) => (
  <Icon {...props}>
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm3 13-8 2 2-8 8-2-2 8z" />
    <circle cx="12" cy="12" r="2" />
  </Icon>
);
