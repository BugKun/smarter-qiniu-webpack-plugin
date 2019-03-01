import Loading from 'Components/Loading';
import Loadable from 'react-loadable';


export default (chunk) => {
    return Loadable({
        loader: chunk,
        loading: Loading
    });
}
