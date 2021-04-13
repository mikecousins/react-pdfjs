import React from 'react';
import { render, wait, waitForDomChange } from '@testing-library/react';
import { DocumentInitParameters } from 'pdfjs-dist/types/display/api';

import Pdf from '../src';

jest.mock('pdfjs-dist', () => ({
  version: '1.0',
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: jest.fn((config: DocumentInitParameters) => ({
    promise: config.url?.includes('fail_document')
      ? Promise.reject()
      : Promise.resolve({
          getPage: jest.fn(() =>
            config.url?.includes('fail_page')
              ? Promise.reject()
              : Promise.resolve({
                  getViewport: jest.fn(() => ({ width: 0, height: 0 })),
                  render: jest.fn(() => ({
                    promise: config.url?.includes('fail_render')
                      ? Promise.reject()
                      : Promise.resolve(),
                  })),
                })
          ),
        }),
  })),
}));

describe('Pdf', () => {
  it('renders children', async () => {
    const { getByText } = render(
      <Pdf file="basic.33e35a62.pdf">
        {({ canvas }) => (
          <div>
            {canvas}
            <div>Test</div>
          </div>
        )}
      </Pdf>
    );

    await waitForDomChange();

    getByText('Test');
  });

  it('calls render function with proper params', async () => {
    const renderFunc = jest.fn(({ canvas }) => canvas);

    render(<Pdf file="basic.33e35a62.pdf">{renderFunc}</Pdf>);

    expect(renderFunc).toBeCalledWith({
      canvas: expect.any(Object),
      pdfDocument: undefined,
      pdfPage: undefined,
    });

    await wait();

    expect(renderFunc).toBeCalledWith({
      canvas: expect.any(Object),
      pdfDocument: expect.any(Object),
      pdfPage: expect.any(Object),
    });
  });

  describe('callbacks', () => {
    const onDocLoadSuccess = jest.fn();
    const onDocLoadFail = jest.fn();
    const onPageLoadSuccess = jest.fn();
    const onPageLoadFail = jest.fn();
    const onPageRenderSuccess = jest.fn();
    const onPageRenderFail = jest.fn();

    beforeEach(() => {
      onDocLoadSuccess.mockClear();
      onDocLoadFail.mockClear();
      onPageLoadSuccess.mockClear();
      onPageLoadFail.mockClear();
      onPageRenderSuccess.mockClear();
      onPageRenderFail.mockClear();
    });

    const renderPdf = (file: string) =>
      render(
        <Pdf
          file={file}
          onDocumentLoadSuccess={onDocLoadSuccess}
          onDocumentLoadFail={onDocLoadFail}
          onPageLoadSuccess={onPageLoadSuccess}
          onPageLoadFail={onPageLoadFail}
          onPageRenderSuccess={onPageRenderSuccess}
          onPageRenderFail={onPageRenderFail}
        >
          {({ canvas }) => canvas}
        </Pdf>
      );

    it('calls proper callbacks when fully successful', async () => {
      renderPdf('basic.33e35a62.pdf');

      await wait();

      expect(onDocLoadSuccess).toBeCalledWith(expect.any(Object));
      expect(onDocLoadFail).not.toBeCalled();
      expect(onPageLoadSuccess).toBeCalledWith(expect.any(Object));
      expect(onPageLoadFail).not.toBeCalled();
      expect(onPageRenderSuccess).toBeCalledWith(expect.any(Object));
      expect(onPageRenderFail).not.toBeCalled();
    });

    it('calls proper callbacks when render failed', async () => {
      renderPdf('fail_render');

      await wait();

      expect(onDocLoadSuccess).toBeCalledWith(expect.any(Object));
      expect(onDocLoadFail).not.toBeCalled();
      expect(onPageLoadSuccess).toBeCalledWith(expect.any(Object));
      expect(onPageLoadFail).not.toBeCalled();
      expect(onPageRenderSuccess).not.toBeCalled();
      expect(onPageRenderFail).toBeCalled();
    });

    it('calls proper callbacks when page load failed', async () => {
      renderPdf('fail_page');

      await wait();

      expect(onDocLoadSuccess).toBeCalledWith(expect.any(Object));
      expect(onDocLoadFail).not.toBeCalled();
      expect(onPageLoadSuccess).not.toBeCalled();
      expect(onPageLoadFail).toBeCalled();
      expect(onPageRenderSuccess).not.toBeCalled();
      expect(onPageRenderFail).not.toBeCalled();
    });

    it('calls proper callbacks when document load failed', async () => {
      renderPdf('fail_document');

      await wait();

      expect(onDocLoadSuccess).not.toBeCalled();
      expect(onDocLoadFail).toBeCalled();
      expect(onPageLoadSuccess).not.toBeCalled();
      expect(onPageLoadFail).not.toBeCalled();
      expect(onPageRenderSuccess).not.toBeCalled();
      expect(onPageRenderFail).not.toBeCalled();
    });
  });
});
