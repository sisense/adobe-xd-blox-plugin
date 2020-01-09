const React = require('react');
const fs = require('uxp').storage.localFileSystem
const application = require("application");
const clipboard = require('clipboard')
const commands = require('commands')
const styles = require('./App.css');
const Checkbox = require('./components/Checkbox/Checkbox');
const { error, alert } = require('./lib/dialogs.js');
const PropTypes = require('prop-types');
const escapeQuote = (str)=> {
    return str.replace(/"/g, "'");
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        min: true,
        svg: false
    };
    this.panel = React.createRef();
    this.onApplyClick = this.onApplyClick.bind(this);
    this.handleChangeSvg = this.handleChangeSvg.bind(this);
    this.handleChangeMin = this.handleChangeMin.bind(this);
  }

  /**
   * @function handleChangeSvg handles changes on checkbox svg
   * @param  {Object} e
   */
  handleChangeSvg(e) {
    this.setState({svg: e.target.checked});
  }
  /**
   * @function handleChangeMin handles changes on checkbox minify
   * @param  {Object} e
   */
  handleChangeMin(e) {
    this.setState({min: e.target.checked});
  }

  /**
   * @function onApplyClick triggers all the changes
   */
  onApplyClick() {
    const { selection } = this.props;
    const { hasArtwork, items } = selection;
    application.editDocument(async selection => {
      if (!hasArtwork) {
        error("No items selected", "Please select items.");
        return;
      }
      // if items selected group them
      if (items.length >= 2) {
        commands.group();
      }
      // create temporary folder and svg file
      const tempFolder = await fs.getTemporaryFolder();
      const file = await tempFolder.createFile("temporary.svg", {
        overwrite: true
      });

      // settings to create SVG
      const renditions = [
        {
          node: selection.items[0],
          outputFile: file,
          type: application.RenditionType.SVG,
          minify: this.state.min,
          embedImages: false
        }
      ];

      // helper function to splice strings
      String.prototype.splice = function(idx, rem, str) {
        return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
      };

      await application.createRenditions(renditions);

      // creating id's for each text tag in the SVG
      let markupCode = await file.read();
      let temp = document.createElement("div");
      temp.innerHTML = markupCode;
      let htmlObject = temp.firstChild;
      let textTags = htmlObject.getElementsByTagName("text");
      textTags.forEach((tag, index) =>
        tag.setAttribute("id", "svgtext" + index)
      );
      let newmark = htmlObject.outerHTML;
      const svgCode = escapeQuote(newmark);
      /**
       * @function idScript
       * @returns String of functions to be attached on template
       */
      let idScript = () => {
        let stringRes = "";
        textTags.forEach((tag, index) => {
          stringRes += `$('#svgtext${index} tspan').text({panel: textvalue${index}});`;
        });
        return stringRes;
      };

      //Blox template with svg
      let bloxTemplate = 
      `{
        "style": "",
        "script": "",
        "title": "",
        "showCarousel": true,
        "body": [
          {
            "type": "Container",
            "items": [
              {
                "type": "TextBlock",
                "text": "<script>${idScript()}</script>${svgCode}",
                "horizontalAlignment": "center"
              }
            ]
          }
        ],
        "actions": []
      }`;

      // copy template or SVG to clipboard
      !this.state.svg? clipboard.copyText(bloxTemplate) : clipboard.copyText(svgCode);
      await alert(
          `${this.state.min? 'Minified' : ''} ${this.state.svg? 'SVG Created!' : 'BloX Template Created!'}`,
          "Template created and copied to clipboard just paste it into your BloX widget!"
          );
        });
    }
    
    render() {
        const {min, svg} = this.state;
        return (
        <panel className={styles.panel}>
          <form
            method="dialog"
            style={{ width: '100%' }}
            onSubmit={this.onApplyClick}
          >
            <div className="checkWrapper">
              <label>
                <Checkbox name={'minify'} checked={min} onChange={this.handleChangeMin} />
              <span>Minify</span>
              </label>
              <label>
                <Checkbox name={'svgonly'} checked={svg} onChange={this.handleChangeSvg} />
              <span>SVG Only</span>
              </label>
            </div>
            <hr/>
            <footer>
              <button id="ok" type="submit" uxp-variant="cta">
                Apply
              </button>
            </footer>
          </form>
        </panel>
        );
    }
}

App.propTypes = {
  selection: PropTypes.objectOf(PropTypes.item),
};

module.exports = App;
