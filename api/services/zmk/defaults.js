const keymapTemplate = `
/*
 * Copyright (c) 2020 The ZMK Contributors
 *
 * SPDX-License-Identifier: MIT
 */


/* THIS FILE WAS GENERATED!
 *
 * This file was generated automatically. You may or may not want to
 * edit it directly.
 */

#include <behaviors.dtsi>
{{behaviour_includes}}

/ {
  behaviors {
    #include "macros.dtsi"

    hm: homerow_mods {
        compatible = "zmk,behavior-hold-tap";
        label = "HOMEROW_MODS";
        #binding-cells = <2>;
        tapping-term-ms = <200>;
        quick_tap_ms = <175>;
        flavor = "tap-preferred";
        bindings = <&kp>, <&kp>;
    };
  };

    keymap {
        compatible = "zmk,keymap";

{{rendered_layers}}
    };
};
`

module.exports = {
  keymapTemplate
}
