# niconico_comment_visualizer

Chrome ウェブストア: https://chrome.google.com/webstore/detail/niconicocommentvisualizer/lahlfbnopindeiocbcconhmdiodmgagb

## 使い方

右上に出るアイコンをクリックするか、動画下のコントローラーに追加されたボタンをクリックする。

## 開発

`$ npm install --save` で依存ライブラリなどがインストールされます。

拡張機能本体のコードは、`./app/scripts`と`./app/styles`ディレクトリにあります。

`$ gulp --watch` で自動的にトランスパイルされます。
出力先は `dist/chrome`です。`dist/chrome`を「パッケージ化されていない拡張機能を読み込む」すると起動します。
