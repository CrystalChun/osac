package driver

import (
	"context"
	"strings"

	csi "github.com/container-storage-interface/spec/lib/go/csi"
	"github.com/osac-project/osac-csi-driver/pkg/proxy"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"k8s.io/klog/v2"
)

// NodeServer implements the CSI Node service.
// It routes node operations to the appropriate vendor CSI driver based on the
// backend information stored in the volume context.
type NodeServer struct {
	csi.UnimplementedNodeServer
	nodeID              string
	proxyMgr            *proxy.Manager
	vendorSockets       map[string]string
	defaultVendorSocket string
}

// NewNodeServer creates a new CSI node server.
func NewNodeServer(nodeID string, proxyMgr *proxy.Manager, vendorSockets map[string]string) *NodeServer {
	return &NodeServer{
		nodeID:              nodeID,
		proxyMgr:            proxyMgr,
		vendorSockets:       vendorSockets,
		defaultVendorSocket: firstSortedSocket(vendorSockets),
	}
}

// NodeStageVolume stages a volume at a staging path by proxying to the vendor CSI driver.
func (n *NodeServer) NodeStageVolume(ctx context.Context, req *csi.NodeStageVolumeRequest) (*csi.NodeStageVolumeResponse, error) {
	klog.Infof("NodeStageVolume called: volumeId=%s stagingPath=%s", req.GetVolumeId(), req.GetStagingTargetPath())

	socketPath, err := n.resolveVendorSocket(req.GetVolumeContext())
	if err != nil {
		return nil, err
	}

	vendorConn, err := n.proxyMgr.GetConnection(socketPath)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewNodeClient(vendorConn)
	resp, err := vendorClient.NodeStageVolume(ctx, req)
	if err != nil {
		if st, ok := status.FromError(err); ok && (st.Code() == codes.Unimplemented || strings.Contains(st.Message(), "not implemented")) {
			klog.Infof("Vendor does not implement NodeStageVolume, treating as no-op: volumeId=%s", req.GetVolumeId())
			return &csi.NodeStageVolumeResponse{}, nil
		}
		klog.Errorf("Vendor NodeStageVolume failed: %v", err)
		return nil, err
	}

	klog.Infof("NodeStageVolume succeeded: volumeId=%s", req.GetVolumeId())
	return resp, nil
}

// NodeUnstageVolume unstages a volume by proxying to the vendor CSI driver.
// TODO: use a local state store to track which vendor staged this volume.
func (n *NodeServer) NodeUnstageVolume(ctx context.Context, req *csi.NodeUnstageVolumeRequest) (*csi.NodeUnstageVolumeResponse, error) {
	klog.Infof("NodeUnstageVolume called: volumeId=%s stagingPath=%s", req.GetVolumeId(), req.GetStagingTargetPath())

	if n.defaultVendorSocket == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := n.proxyMgr.GetConnection(n.defaultVendorSocket)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewNodeClient(vendorConn)
	resp, err := vendorClient.NodeUnstageVolume(ctx, req)
	if err != nil {
		if st, ok := status.FromError(err); ok && (st.Code() == codes.Unimplemented || strings.Contains(st.Message(), "not implemented")) {
			klog.Infof("Vendor does not implement NodeUnstageVolume, treating as no-op: volumeId=%s", req.GetVolumeId())
			return &csi.NodeUnstageVolumeResponse{}, nil
		}
		klog.Errorf("Vendor NodeUnstageVolume failed: %v", err)
		return nil, err
	}

	klog.Infof("NodeUnstageVolume succeeded: volumeId=%s", req.GetVolumeId())
	return resp, nil
}

// NodePublishVolume publishes a volume at a target path by proxying to the vendor CSI driver.
func (n *NodeServer) NodePublishVolume(ctx context.Context, req *csi.NodePublishVolumeRequest) (*csi.NodePublishVolumeResponse, error) {
	klog.Infof("NodePublishVolume called: volumeId=%s targetPath=%s", req.GetVolumeId(), req.GetTargetPath())

	socketPath, err := n.resolveVendorSocket(req.GetVolumeContext())
	if err != nil {
		return nil, err
	}

	vendorConn, err := n.proxyMgr.GetConnection(socketPath)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewNodeClient(vendorConn)
	resp, err := vendorClient.NodePublishVolume(ctx, req)
	if err != nil {
		klog.Errorf("Vendor NodePublishVolume failed: %v", err)
		return nil, err
	}

	klog.Infof("NodePublishVolume succeeded: volumeId=%s", req.GetVolumeId())
	return resp, nil
}

// NodeUnpublishVolume unpublishes a volume by proxying to the vendor CSI driver.
// TODO: use a local state store to track which vendor published this volume.
func (n *NodeServer) NodeUnpublishVolume(ctx context.Context, req *csi.NodeUnpublishVolumeRequest) (*csi.NodeUnpublishVolumeResponse, error) {
	klog.Infof("NodeUnpublishVolume called: volumeId=%s targetPath=%s", req.GetVolumeId(), req.GetTargetPath())

	if n.defaultVendorSocket == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := n.proxyMgr.GetConnection(n.defaultVendorSocket)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewNodeClient(vendorConn)
	resp, err := vendorClient.NodeUnpublishVolume(ctx, req)
	if err != nil {
		klog.Errorf("Vendor NodeUnpublishVolume failed: %v", err)
		return nil, err
	}

	klog.Infof("NodeUnpublishVolume succeeded: volumeId=%s", req.GetVolumeId())
	return resp, nil
}

// NodeGetCapabilities returns the capabilities supported by this node plugin.
func (n *NodeServer) NodeGetCapabilities(_ context.Context, _ *csi.NodeGetCapabilitiesRequest) (*csi.NodeGetCapabilitiesResponse, error) {
	klog.Infof("NodeGetCapabilities called")
	return &csi.NodeGetCapabilitiesResponse{
		Capabilities: []*csi.NodeServiceCapability{
			{
				Type: &csi.NodeServiceCapability_Rpc{
					Rpc: &csi.NodeServiceCapability_RPC{
						Type: csi.NodeServiceCapability_RPC_STAGE_UNSTAGE_VOLUME,
					},
				},
			},
		},
	}, nil
}

// NodeGetInfo returns information about this node.
func (n *NodeServer) NodeGetInfo(_ context.Context, _ *csi.NodeGetInfoRequest) (*csi.NodeGetInfoResponse, error) {
	klog.Infof("NodeGetInfo called: nodeId=%s", n.nodeID)
	return &csi.NodeGetInfoResponse{
		NodeId: n.nodeID,
	}, nil
}

// NodeGetVolumeStats proxies the call to the default vendor CSI driver.
func (n *NodeServer) NodeGetVolumeStats(ctx context.Context, req *csi.NodeGetVolumeStatsRequest) (*csi.NodeGetVolumeStatsResponse, error) {
	klog.Infof("NodeGetVolumeStats called: volumeId=%s volumePath=%s", req.GetVolumeId(), req.GetVolumePath())

	if n.defaultVendorSocket == "" {
		return nil, status.Error(codes.FailedPrecondition, "no vendor sockets configured")
	}

	vendorConn, err := n.proxyMgr.GetConnection(n.defaultVendorSocket)
	if err != nil {
		return nil, status.Errorf(codes.Unavailable, "failed to connect to vendor CSI driver: %v", err)
	}

	vendorClient := csi.NewNodeClient(vendorConn)
	return vendorClient.NodeGetVolumeStats(ctx, req)
}

func (n *NodeServer) resolveVendorSocket(volumeContext map[string]string) (string, error) {
	backend := ""
	if volumeContext != nil {
		backend = volumeContext["osac.backend"]
	}

	if backend == "" {
		klog.Infof("No osac.backend in volume context, using default vendor socket")
		if n.defaultVendorSocket == "" {
			return "", status.Error(codes.FailedPrecondition, "no vendor sockets configured")
		}
		return n.defaultVendorSocket, nil
	}

	socketPath, ok := n.vendorSockets[backend]
	if !ok {
		return "", status.Errorf(codes.NotFound, "no vendor socket found for backend %q", backend)
	}

	return socketPath, nil
}
