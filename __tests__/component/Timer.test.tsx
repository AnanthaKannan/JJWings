import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Timer from '../../src/component/Timer';
import { useFocusEffect } from '@react-navigation/native';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

describe('Timer', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();

    (useFocusEffect as jest.Mock).mockImplementation(callback => {
      cleanup = callback();
    });
  });

  afterEach(() => {
    cleanup?.();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should render formatted time', async () => {
    const { getByText } = await render(
      <Timer timeLeft={65} setTimeLeft={jest.fn()} />,
    );

    expect(getByText('01:05')).toBeTruthy();
  });

  // it('should increment timer every second', () => {
  //   const setTimeLeft = jest.fn();

  //   render(<Timer timeLeft={0} setTimeLeft={setTimeLeft} />);
  //   expect(setTimeLeft).not.toHaveBeenCalled();

  //   jest.advanceTimersByTime(1000);
  //   expect(setTimeLeft).toHaveBeenCalledTimes(1);
  //   expect(setTimeLeft).toHaveBeenCalledWith(expect.any(Function));
  //   jest.advanceTimersByTime(2000);
  //   expect(setTimeLeft).toHaveBeenCalledTimes(3);
  // });

  // it('should clear interval on cleanup', () => {
  //   const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

  //   render(<Timer timeLeft={0} setTimeLeft={jest.fn()} />);

  //   cleanup?.();

  //   expect(clearIntervalSpy).toHaveBeenCalled();

  //   clearIntervalSpy.mockRestore();
  // });

  // it('should correctly update previous state', () => {
  //   const setTimeLeft = jest.fn();

  //   render(<Timer timeLeft={0} setTimeLeft={setTimeLeft} />);

  //   jest.advanceTimersByTime(1000);

  //   const updater = setTimeLeft.mock.calls[0][0];

  //   expect(updater(5)).toBe(6);
  //   expect(updater(10)).toBe(11);
  // });
});
