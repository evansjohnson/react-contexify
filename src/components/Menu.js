/* global: window */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import cloneChildren from './cloneChildren';

import { HIDE_ALL, DISPLAY_MENU } from '../utils/actions';
import styles from '../utils/styles';
import eventManager from '../utils/eventManager';

const KEY = {
  ENTER: 13,
  ESC: 27
};

class Menu extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    theme: PropTypes.string,
    animation: PropTypes.string
  };

  static defaultProps = {
    className: null,
    style: {},
    theme: null,
    animation: null
  };

  state = {
    x: 0,
    y: 0,
    visible: false,
    nativeEvent: null
  };

  menuRef = null;
  unsub = [];

  componentDidMount() {
    this.unsub.push(eventManager.on(DISPLAY_MENU(this.props.id), this.show));
    this.unsub.push(eventManager.on(HIDE_ALL, this.hide));
  }

  componentWillUnmount() {
    this.unsub.forEach(cb => cb());
    this.unBindWindowEvent();
  }

  bindWindowEvent = () => {
    window.addEventListener('resize', this.hide);
    window.addEventListener('contextmenu', this.hide);
    window.addEventListener('mousedown', this.hide);
    window.addEventListener('click', this.hide);
    window.addEventListener('scroll', this.hide);
    window.addEventListener('keydown', this.handleKeyboard);
  };

  unBindWindowEvent = () => {
    window.removeEventListener('resize', this.hide);
    window.removeEventListener('contextmenu', this.hide);
    window.removeEventListener('mousedown', this.hide);
    window.removeEventListener('click', this.hide);
    window.removeEventListener('scroll', this.hide);
    window.removeEventListener('keydown', this.handleKeyboard);
  };

  onMouseEnter = () => window.removeEventListener('mousedown', this.hide);

  onMouseLeave = () => window.addEventListener('mousedown', this.hide);

  hide = e => {
    // Safari trigger a click event when you ctrl + trackpad
    // Firefox:  trigger a click event when right click occur
    if (
      typeof e !== 'undefined' &&
      (e.button === 2 || e.ctrlKey === true) &&
      e.type !== 'contextmenu'
    ) {
      return;
    }

    this.unBindWindowEvent();
    this.setState({ visible: false });
  };

  handleKeyboard = e => {
    if (e.keyCode === KEY.ENTER || e.keyCode === KEY.ESC) {
      this.unBindWindowEvent();
      this.setState({ visible: false });
    }
  };

  setRef = ref => {
    this.menuRef = ref;
  };

  setMenuPosition() {
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const { offsetWidth: menuWidth, offsetHeight: menuHeight } = this.menuRef;
    let { x, y } = this.state;

    if (x + menuWidth > windowWidth) {
      x -= x + menuWidth - windowWidth;
    }

    if (y + menuHeight > windowHeight) {
      y -= y + menuHeight - windowHeight;
    }

    this.setState(
      {
        x,
        y
      },
      this.bindWindowEvent
    );
  }

  getMousePosition(e) {
    const pos = {
      x: e.clientX,
      y: e.clientY
    };

    if (
      e.type === 'touchend' &&
      (pos.x === null || pos.y === null) &&
      (e.changedTouches !== null && e.changedTouches.length > 0)
    ) {
      pos.x = e.changedTouches[0].clientX;
      pos.y = e.changedTouches[0].clientY;
    }

    if (pos.x === null || pos.x < 0) {
      pos.x = 0;
    }

    if (pos.y === null || pos.y < 0) {
      pos.y = 0;
    }

    return pos;
  }

  show = e => {
    e.stopPropagation();
    eventManager.emit(HIDE_ALL);

    // store for later use
    const { x, y } = this.getMousePosition(e);

    this.setState(
      {
        visible: true,
        x,
        y,
        nativeEvent: e
      },
      this.setMenuPosition
    );
  };

  render() {
    const { theme, animation, style, className, children } = this.props;
    const cssClasses = cx(styles.menu, className, {
      [styles.theme + theme]: theme !== null,
      [styles.animationWillEnter + animation]: animation !== null
    });
    const menuStyle = {
      ...style,
      left: this.state.x,
      top: this.state.y + 1,
      opacity: 1
    };

    return (
      this.state.visible && (
        <div
          className={cssClasses}
          style={menuStyle}
          ref={this.setRef}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
        >
          <div>
            {cloneChildren(children, { nativeEvent: this.state.nativeEvent })}
          </div>
        </div>
      )
    );
  }
}

export default Menu;
